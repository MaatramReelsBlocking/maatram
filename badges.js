/* Shared MAATRAM focus badge tiers. Keep names, ranges and artwork in one place. */
(function (root) {
  'use strict';
  var badges = [
    { id: 'badge1', name: 'Sprout Initiate', min: 0, max: 250, img: 'images/badges/badge1.webp', thumb: 'images/badges/t1.webp', description: 'Planted the seed of focus. Your journey starts here.' },
    { id: 'badge2', name: 'Silver Bloom', min: 251, max: 750, img: 'images/badges/badge2.webp', thumb: 'images/badges/t2.webp', description: 'Your discipline begins to blossom.' },
    { id: 'badge3', name: 'Shinobi Shield', min: 751, max: 1750, img: 'images/badges/badge3.webp', thumb: 'images/badges/t3.webp', description: 'Endurance in the face of digital distraction.' },
    { id: 'badge4', name: "Golden Mind's Eye", min: 1751, max: 3500, img: 'images/badges/badge4.webp', thumb: 'images/badges/t4.webp', description: 'Unwavering focus, even when distractions call.' },
    { id: 'badge5', name: 'Crystal Ronin', min: 3501, max: 7000, img: 'images/badges/badge5.webp', thumb: 'images/badges/t5.webp', description: 'A master of deep focus and deliberate time.' },
    { id: 'badge6', name: 'Crown Legend', min: 7001, max: 10000, img: 'images/badges/badge6.webp', thumb: 'images/badges/t6.webp', description: 'The highest focus tier. A true Maatram legend.' }
  ];
  root.MAATRAM_BADGES = badges;
  root.maatramBadgeForPoints = function (points) {
    var score = Math.max(0, Number(points) || 0);
    var badge = badges[0];
    for (var i = 0; i < badges.length; i++) {
      if (score >= badges[i].min) badge = badges[i];
    }
    return badge;
  };
})(window);
