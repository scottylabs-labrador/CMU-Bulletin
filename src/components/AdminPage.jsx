import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
} from 'firebase/firestore';
import { db, getUserDisplayName } from '../firebase';
import { useIsAdmin } from '../hooks/useIsAdmin';
import { filterPosters } from '../utils/filterPosters';
import {
  DEFAULT_POSTER_SORT,
  DEFAULT_POSTER_SORT_DIRECTION,
  sortPosters,
} from '../utils/sortPosters';
import { getPosterStatus } from '../utils/posterStatus';
import { formatDisplayDate } from '../utils/eventDateTime';
import Modal from './Modal';
import './AdminPage.css';

const PAGE_SIZE = 20;
const BULK_TYPE_THRESHOLD = 5;

function AdminGate({ title, children, actions }) {
  return (
    <div className="page-content admin-page">
      <div className="admin-gate">
        <h2>{title}</h2>
        {children}
        {actions && <div className="admin-gate__actions">{actions}</div>}
      </div>
    </div>
  );
}

function DeleteConfirmDialog({ count, onCancel, onConfirm, busy }) {
  const requiresTypedCount = count >= BULK_TYPE_THRESHOLD;
  const [typed, setTyped] = useState('');
  const canConfirm = !requiresTypedCount || typed.trim() === String(count);

  return (
    <div className="admin-confirm-overlay" role="presentation" onClick={onCancel}>
      <div
        className="admin-confirm"
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-delete-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h3 id="admin-delete-title">
          {count === 1 ? 'Delete poster?' : `Delete ${count} posters?`}
        </h3>
        <p>
          This permanently removes {count === 1 ? 'this poster' : 'these posters'} from
          Firestore. Hard deletes cannot be undone from the app.
        </p>
        <p className="admin-confirm__danger-note">
          Recovery requires Firestore PITR or a backup if enabled on the project.
        </p>
        {requiresTypedCount && (
          <>
            <p>
              Type <strong>{count}</strong> to confirm this large selection:
            </p>
            <input
              type="text"
              inputMode="numeric"
              value={typed}
              onChange={(event) => setTyped(event.target.value)}
              placeholder={String(count)}
              autoFocus
              aria-label={`Type ${count} to confirm`}
            />
          </>
        )}
        <div className="admin-confirm__actions">
          <button type="button" className="admin-btn" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
          <button
            type="button"
            className="admin-btn admin-btn--danger"
            onClick={onConfirm}
            disabled={!canConfirm || busy}
          >
            {busy ? 'Deleting…' : count === 1 ? 'Delete' : `Delete ${count}`}
          </button>
        </div>
      </div>
    </div>
  );
}

function AdminDashboard({ user }) {
  const navigate = useNavigate();
  const [posters, setPosters] = useState([]);
  const [uploaderNames, setUploaderNames] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState(DEFAULT_POSTER_SORT);
  const [sortDirection, setSortDirection] = useState(DEFAULT_POSTER_SORT_DIRECTION);
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [selectedPoster, setSelectedPoster] = useState(null);
  const [pendingDeleteIds, setPendingDeleteIds] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [actionError, setActionError] = useState(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'posters'),
      (snapshot) => {
        const data = snapshot.docs.map((posterDoc) => ({
          id: posterDoc.id,
          ...posterDoc.data(),
        }));
        setPosters(data);
        setLoading(false);
      },
      (err) => {
        console.error('Failed to load posters for admin:', err);
        setActionError('Failed to load posters.');
        setLoading(false);
      }
    );
    return unsubscribe;
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadNames = async () => {
      const ids = [...new Set(posters.map((p) => p.uploaded_by).filter(Boolean))];
      const missing = ids.filter((id) => !uploaderNames[id]);
      if (missing.length === 0) return;

      const next = { ...uploaderNames };
      await Promise.all(
        missing.map(async (uid) => {
          try {
            const snap = await getDoc(doc(db, 'users', uid));
            next[uid] = snap.exists() ? getUserDisplayName(snap.data()) : 'Unknown';
          } catch {
            next[uid] = 'Unknown';
          }
        })
      );
      if (!cancelled) setUploaderNames(next);
    };

    loadNames();
    return () => {
      cancelled = true;
    };
    // Intentionally depend on posters only; names cache grows as posters load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [posters]);

  const filtered = useMemo(() => {
    let list = filterPosters(posters, {
      searchQuery,
      uploaderNames,
      excludePastEvents: false,
    });

    if (statusFilter !== 'all') {
      list = list.filter((poster) => getPosterStatus(poster).key === statusFilter);
    }

    return sortPosters(list, sortBy, uploaderNames, sortDirection);
  }, [posters, searchQuery, statusFilter, sortBy, sortDirection, uploaderNames]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(pageStart, pageStart + PAGE_SIZE);

  useEffect(() => {
    setPage(1);
    setSelectedIds(new Set());
  }, [searchQuery, statusFilter, sortBy, sortDirection]);

  const allPageSelected =
    pageItems.length > 0 && pageItems.every((poster) => selectedIds.has(poster.id));

  const toggleSelectAllPage = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allPageSelected) {
        pageItems.forEach((poster) => next.delete(poster.id));
      } else {
        pageItems.forEach((poster) => next.add(poster.id));
      }
      return next;
    });
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const runDelete = async (ids) => {
    setDeleting(true);
    setActionError(null);
    try {
      await Promise.all(ids.map((id) => deleteDoc(doc(db, 'posters', id))));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        ids.forEach((id) => next.delete(id));
        return next;
      });
      if (selectedPoster && ids.includes(selectedPoster.id)) {
        setSelectedPoster(null);
      }
      setPendingDeleteIds(null);
    } catch (err) {
      console.error('Admin delete failed:', err);
      setActionError(err.message || 'Failed to delete poster(s).');
    } finally {
      setDeleting(false);
    }
  };

  const selectedCount = selectedIds.size;

  return (
    <div className="page-content admin-page">
      <div className="admin-page__header">
        <div>
          <h1 className="admin-page__title">Poster admin</h1>
          <p className="admin-page__subtitle">
            Manage all posters for demos. Signed in as {user.email}.
          </p>
        </div>
        <Link to="/" className="admin-btn">
          Back to site
        </Link>
      </div>

      <p className="admin-page__warning">
        Deletes are hard deletes — posters are removed permanently from Firestore.
        Use Firestore PITR or backups if you may need recovery.
      </p>

      {actionError && (
        <p className="admin-page__warning" role="alert">
          {actionError}
        </p>
      )}

      <div className="admin-toolbar">
        <input
          className="admin-toolbar__search"
          type="search"
          placeholder="Search title, organizer, tags…"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          aria-label="Search posters"
        />
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          aria-label="Filter by status"
        >
          <option value="all">All statuses</option>
          <option value="upcoming">Upcoming</option>
          <option value="past">Past</option>
          <option value="repeating">Repeating</option>
          <option value="unknown">No date</option>
        </select>
        <select
          value={sortBy}
          onChange={(event) => setSortBy(event.target.value)}
          aria-label="Sort by"
        >
          <option value="time">Event time</option>
          <option value="name">Event name</option>
          <option value="organizer">Organizer</option>
        </select>
        <select
          value={sortDirection}
          onChange={(event) => setSortDirection(event.target.value)}
          aria-label="Sort direction"
        >
          <option value="asc">Ascending</option>
          <option value="desc">Descending</option>
        </select>
      </div>

      {selectedCount > 0 && (
        <div className="admin-bulk-bar">
          <span className="admin-bulk-bar__count">{selectedCount} selected</span>
          <button
            type="button"
            className="admin-btn admin-btn--ghost"
            onClick={() => setSelectedIds(new Set())}
          >
            Clear
          </button>
          <button
            type="button"
            className="admin-btn admin-btn--danger"
            onClick={() => setPendingDeleteIds([...selectedIds])}
          >
            Delete selected
          </button>
        </div>
      )}

      <div className="admin-table-wrap">
        {loading ? (
          <div className="admin-empty">Loading posters…</div>
        ) : filtered.length === 0 ? (
          <div className="admin-empty">No posters match these filters.</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th scope="col">
                  <input
                    type="checkbox"
                    checked={allPageSelected}
                    onChange={toggleSelectAllPage}
                    aria-label="Select all on this page"
                  />
                </th>
                <th scope="col">Poster</th>
                <th scope="col">Title</th>
                <th scope="col">Status</th>
                <th scope="col">Event date</th>
                <th scope="col">Uploader</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((poster) => {
                const status = getPosterStatus(poster);
                const eventDate =
                  poster.sort_date ||
                  (poster.repeating ? poster.next_occurring_date : poster.single_event_date);
                const isSelected = selectedIds.has(poster.id);

                return (
                  <tr
                    key={poster.id}
                    className={`admin-table__row${isSelected ? ' admin-table__row--selected' : ''}`}
                    onClick={() => setSelectedPoster(poster)}
                  >
                    <td onClick={(event) => event.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(poster.id)}
                        aria-label={`Select ${poster.title || 'poster'}`}
                      />
                    </td>
                    <td>
                      {poster.image_url ? (
                        <img
                          src={poster.image_url}
                          alt=""
                          className="admin-table__thumb"
                        />
                      ) : (
                        <span className="admin-table__meta">—</span>
                      )}
                    </td>
                    <td>
                      <div className="admin-table__title">{poster.title || 'Untitled'}</div>
                      <div className="admin-table__meta">
                        {poster.organizer || uploaderNames[poster.uploaded_by] || 'Unknown'}
                      </div>
                    </td>
                    <td>
                      <span className={`admin-badge admin-badge--${status.key}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="admin-table__meta">
                      {eventDate ? formatDisplayDate(eventDate) : '—'}
                    </td>
                    <td className="admin-table__meta">
                      {uploaderNames[poster.uploaded_by] || 'Unknown'}
                    </td>
                    <td onClick={(event) => event.stopPropagation()}>
                      <div className="admin-table__actions">
                        <button
                          type="button"
                          className="admin-icon-btn"
                          aria-label="Edit poster"
                          onClick={() =>
                            navigate(`/edit-poster/${poster.id}`, {
                              state: { from: '/admin', asAdmin: true },
                            })
                          }
                        >
                          <img src="/pen.svg" alt="" />
                        </button>
                        <button
                          type="button"
                          className="admin-icon-btn admin-icon-btn--delete"
                          aria-label="Delete poster"
                          onClick={() => setPendingDeleteIds([poster.id])}
                        >
                          <img src="/trash.svg" alt="" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {!loading && filtered.length > 0 && (
        <div className="admin-pagination">
          <span className="admin-pagination__info">
            Showing {pageStart + 1}–{Math.min(pageStart + PAGE_SIZE, filtered.length)} of{' '}
            {filtered.length}
          </span>
          <div className="admin-pagination__controls">
            <button
              type="button"
              className="admin-btn"
              disabled={currentPage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </button>
            <span className="admin-pagination__info">
              Page {currentPage} / {totalPages}
            </span>
            <button
              type="button"
              className="admin-btn"
              disabled={currentPage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {selectedPoster && (
        <Modal
          poster={selectedPoster}
          onClose={() => setSelectedPoster(null)}
          user={user}
          likedPosters={[]}
          handleLikeToggle={() => {}}
          uploaderName={uploaderNames[selectedPoster.uploaded_by]}
        />
      )}

      {pendingDeleteIds && (
        <DeleteConfirmDialog
          count={pendingDeleteIds.length}
          busy={deleting}
          onCancel={() => !deleting && setPendingDeleteIds(null)}
          onConfirm={() => runDelete(pendingDeleteIds)}
        />
      )}
    </div>
  );
}

function AdminPage({ user }) {
  const { status } = useIsAdmin(user);

  if (!user || status === 'signed-out') {
    return (
      <AdminGate
        title="Sign in required"
        actions={
          <>
            <Link
              to="/authlogin"
              state={{ from: '/admin' }}
              className="admin-btn admin-btn--primary"
            >
              Log in
            </Link>
            <Link to="/" className="admin-btn">
              Home
            </Link>
          </>
        }
      >
        <p>You need to sign in with an admin account to manage posters.</p>
      </AdminGate>
    );
  }

  if (status === 'loading') {
    return (
      <AdminGate title="Checking access…">
        <p>Verifying admin permissions.</p>
      </AdminGate>
    );
  }

  if (status === 'no') {
    return (
      <AdminGate
        title="No admin access"
        actions={
          <Link to="/" className="admin-btn admin-btn--primary">
            Back to home
          </Link>
        }
      >
        <p>
          Your account ({user.email || 'unknown email'}) is not on the admin list
          {user.emailVerified ? '' : ', or your email is not verified'}.
          An existing admin must create <code>admins/&lt;your-lowercase-email&gt;</code> in
          the Firebase console.
        </p>
      </AdminGate>
    );
  }

  return <AdminDashboard user={user} />;
}

export default AdminPage;
