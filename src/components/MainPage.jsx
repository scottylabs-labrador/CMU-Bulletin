import React, { useState } from "react";
import PosterFilters from "./PosterFilters";
import PosterList from "./PosterList";

function MainPage({ user, activeCategory, filterDate, setFilterDate, filterLocations, setFilterLocations, filterTags, setFilterTags, searchQuery, setSearchQuery, availableTags, viewMode, toggleViewMode  }) {

  return (
    <div className="main-page">
      
      <PosterFilters
        filterDate={filterDate}
        setFilterDate={setFilterDate}
        filterLocations={filterLocations}
        setFilterLocations={setFilterLocations}
        filterTags={filterTags}
        setFilterTags={setFilterTags}
        availableTags={availableTags}
        toggleViewMode={toggleViewMode}
        activeCategory={activeCategory}
      />

      <div className="poster-list-wrapper">

        <PosterList
            filterDate={filterDate}
            filterLocations={filterLocations}
            filterTags={filterTags}
            searchQuery={searchQuery}
            user={user}
            viewMode={viewMode}
        />
        </div>

    </div>
  );
}

export default MainPage;
