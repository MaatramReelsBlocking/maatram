/* Maatram survey: questions, star mapping and aggregation. Shared by survey.html (the form)
   and ratings.html (live results). Question text must stay identical to the old Google Form
   headers, so answers from that form still add up with new ones. */
(function (root) {
  var STARS = { Excellent: 5, Good: 4, Fair: 3, Poor: 1 };
  var QUESTIONS = [
    { id: 'freq', q: 'How frequently do you use the app to track or manage your screen time?',
      options: ['Multiple times a day', 'Once a day', 'A few times a week', 'Once a week', 'Rarely'] },
    { id: 'ease', q: 'How easy was it to set up and navigate through the app?',
      options: ['Very easy', 'Easy', 'Neutral', 'Difficult', 'Very difficult'] },
    { id: 'feature', q: 'Which feature of the app do you find most useful?',
      options: ['App blocking / Screen limits', 'Rewards / Focus streak tracking', 'Study rooms', 'Timers (Pomodoro / Deep Work)', 'Stats', 'Other'] },
    { id: 'alerts', q: "How effective are the app's alerts or reminders in helping you stop using your device?",
      options: ['Extremely effective', 'Effective', 'Somewhat effective', 'Not effective'] },
    { id: 'cut', q: 'On average, how much has your daily non-academic screen time decreased since using the app?',
      options: ['More than 2 hours', '1 to 2 hours', '30 mins', 'Not at all'] },
    { id: 'apps', q: 'On which type of apps has this tool helped you cut down the most time?',
      options: ['Social media', 'Video streaming', 'Games', 'Other'] },
    { id: 'benefit', q: 'What primary benefit have you noticed in your daily life since reducing your screen time?',
      options: ['Better focus on studies and homework', 'More time for sleep', 'More time for family and friends', 'Other'] },
    { id: 'design', q: 'How appealing and engaging is the overall design and interface of the app?',
      options: ['Very attractive and fun to use', 'Simple and clear', 'Could be better'] },
    { id: 'recommend', q: 'How likely are you to recommend this app to a classmate or friend?',
      options: ['Highly likely', 'Likely', 'Not sure', 'Unlikely'] },
    { id: 'overall', q: 'Overall, how would you rate your experience with this app?',
      options: ['Excellent', 'Good', 'Fair', 'Poor'] },
    { id: 'text', q: 'Do you have any suggestions, feature ideas, or general feedback to help us improve the app?', text: true }
  ];
  var SKIP = /^(no|nil|none|na|n\/a|hi|hello|nothing|-|\.)$/i;   // empty-ish feedback is not shown
  var EMPTY = function () { return { dist: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }, questions: [], reviews: [], responses: 0 }; };

  /* docs: [{ stars, answers, at: Date|null }] from Firestore surveys/{uid}.
     fmt turns a Date into the label shown on the page. */
  function liveStats(docs, fmt) {
    var out = EMPTY();
    var qs = QUESTIONS.filter(function (q) { return !q.text && !/overall.*rate/i.test(q.q); });
    qs.forEach(function (q) { out.questions.push({ q: q.q, counts: {} }); });
    docs.forEach(function (d) {
      var a = d.answers || {}, s = +d.stars;
      if (s >= 1 && s <= 5) { out.dist[s]++; out.responses++; }
      qs.forEach(function (q, i) { var v = a[q.id]; if (v) out.questions[i].counts[v] = (out.questions[i].counts[v] || 0) + 1; });
      var text = String(a.text || '').trim().slice(0, 400);
      if (text.length >= 8 && !SKIP.test(text)) out.reviews.push({ stars: s || 0, text: text, at: d.at ? fmt(d.at) : '' });
    });
    out.questions = out.questions.filter(function (q) { return Object.keys(q.counts).length; });
    return out;
  }

  /* a: legacy snapshot from /api/ratings (may be null), b: liveStats (may be null). Live rows first. */
  function merge(a, b) {
    var out = EMPTY(), byQ = {};
    [b, a].forEach(function (s) {
      if (!s) return;
      for (var k in s.dist) out.dist[k] += s.dist[k];
      out.responses += s.responses || 0;
      out.reviews = out.reviews.concat(s.reviews || []);
      (s.questions || []).forEach(function (q) {
        var t = byQ[q.q] || (byQ[q.q] = { q: q.q, counts: {} });
        for (var o in q.counts) t.counts[o] = (t.counts[o] || 0) + q.counts[o];
      });
    });
    out.questions = Object.keys(byQ).map(function (k) { return byQ[k]; });
    return out;
  }

  root.MAATRAM_SURVEY = { stars: STARS, questions: QUESTIONS, liveStats: liveStats, merge: merge };
})(typeof window !== 'undefined' ? window : globalThis);
