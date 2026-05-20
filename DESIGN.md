# DESIGN.md

## Purpose

This site is a public, static presentation of mathematical projects, computational experiments, and generated graph catalogues.

At this stage the priority is **layout and navigation**, not visual polish.  The design should make it easy to read mathematical exposition, move through a project chapter, and inspect generated data.

Colours, typography refinements, and decorative CSS can come later.

## Design Goals

The site should feel like a small mathematical book or set of research notes, not like a marketing site.

The main goals are:

* clear navigation;
* stable page structure;
* readable mathematical exposition;
* easy movement between related sections;
* permanent orientation in the contents tree;
* smooth access to generated catalogues and computational artefacts.

The design should support both polished exposition and evolving research notes.

## Influences

The intended style is closest to:

* Jupyter Book;
* modern mathematical documentation;
* online lecture notes;
* structured technical manuals.

The n-Category Café is also an influence, but more for intellectual atmosphere than for layout.  It suggests that the site may eventually include informal notes, experiments, and discussions of ideas in progress.

## Overall Layout

Each page should have three main regions:

```text
+--------------------------------------------------+
| Top bar: Home | Publications | About             |
+----------------------+---------------------------+
| Left contents sidebar | Main page content         |
|                      |                           |
|                      |                           |
+----------------------+---------------------------+
| Previous section              Next section        |
+--------------------------------------------------+
```

On desktop, the left sidebar should be permanent and visible while reading.

On small screens, the sidebar may collapse into a menu or drawer.

## Top Bar

The top bar is for global navigation only.

Initial links:

```text
Home | Publications | About
```

The top bar should remain simple.  It should not contain detailed project navigation.

Possible later additions:

```text
Home | Projects | Publications | About
```

but only if the home page becomes too crowded.

## Left Sidebar: Contents

The left sidebar is the main navigation system.

It should be headed:

```text
Contents
```

Under this heading, each major project appears as a chapter.

Example:

```text
Contents

F4 Series
  Introduction
  Closed graphs
  Four-valent sources
  Reduction traces
  Polynomial obstruction
  Implementation notes

E6 Series
  Introduction
  Bipartite sources
  Seven-term relation
  Local reductions
  Catalogues

Jordan Structures
  Introduction
  Cubic norm
  Quadratic adjoint
  Relation to E6

Affine G2
  Introduction
  Representations
  R-matrix calculations

Notes
  Experiments
  Reading notes
  Open questions
```

The precise chapter list can change.  The important point is that projects are treated as chapters, with sections inside them.

## Current Page Marker

The contents sidebar should visibly mark the current page.

Minimum behaviour:

* the current page is highlighted;
* its parent chapter is expanded;
* other chapters may be collapsed;
* the reader can always see where they are.

Possible visual treatments, to be decided later:

* bold text;
* a vertical bar;
* a light background;
* a small marker such as `>`.

For now, the implementation only needs a clear class such as:

```html
<a class="active" href="...">Closed graphs</a>
```

The exact CSS can come later.

## Previous / Next Navigation

Within each chapter, pages should form a sequence.

At the bottom of each page there should be links of the form:

```text
← Previous: Closed graphs        Next: Reduction traces →
```

This supports reading a project as a chapter rather than as isolated pages.

Previous/next links should usually stay inside the current chapter.  Moving from the last section of one chapter to the first section of the next should be a deliberate design decision, not automatic unless wanted.

## Main Content Area

The main content area should be calm and readable.

It should support:

* prose;
* displayed mathematics;
* diagrams;
* code snippets;
* generated tables;
* graph catalogue viewers;
* reduction traces;
* links to JSON cache files.

The page content should normally begin with a clear title:

```markdown
# Closed graphs in the F4 series
```

Long pages may later have a right-hand "On this page" outline, but this is optional and not part of the first layout target.

## Page Types

The site should support several kinds of pages.

### 1. Expository pages

These explain the mathematics.

Examples:

* overview of the F4 series;
* explanation of the six-term relation;
* motivation for the polynomial obstruction;
* background on Jordan structures.

These pages should prioritise readability.

### 2. Catalogue pages

These inspect generated JSON caches.

Examples:

* closed trivalent graphs at a fixed number of vertices;
* four-valent sources;
* E6 bipartite sources;
* reduction traces.

Catalogue pages may contain JavaScript controls, but should still sit inside the same layout.

### 3. Computation narrative pages

These explain a computation step-by-step.

Examples:

* generating sources;
* applying the six-term relation;
* reducing terms;
* extracting the polynomial obstruction.

These pages may link to catalogue pages as supporting evidence.

### 4. Informal notes

These are less polished pages for experiments, questions, and observations.

They allow the site to remain alive without forcing every idea into a final exposition.

## Generated Data and Static Site Boundary

The site should remain static.

Heavy computation belongs outside the website.

The intended boundary is:

```text
cubic-jordan
  generates JSON caches, DOT data, invariants, traces

trivalent-graphs
  displays and inspects the generated data
```

The browser should load JSON files and render them using JavaScript.

The browser should not depend on SageMath.

## Catalogue Data Requirements

Catalogue JSON files should contain enough information for the browser to display useful entries without recomputation.

Useful fields include:

* graph key;
* number of vertices;
* invariants;
* DOT representation;
* SVG representation, if precomputed;
* relation name;
* replacement terms;
* reduction trace steps;
* provenance information where available.

If a catalogue page needs a field, that field should be written into the cache by the export process rather than recomputed in the browser.

## JavaScript Role

JavaScript is used for interaction and display only.

It may:

* load JSON cache files;
* populate selectors;
* switch between records;
* render DOT/SVG already present in the cache;
* show invariants;
* show MathJax expressions;
* manage previous/next links if desired.

It should not contain mathematical algorithms that belong in the research code.

## CSS Strategy

CSS should initially solve layout problems only.

First priorities:

* fixed top bar;
* permanent left sidebar on desktop;
* readable main content width;
* active page marker;
* previous/next footer;
* responsive collapse on small screens.

Deferred decisions:

* colours;
* fonts;
* detailed typography;
* dark mode;
* animations;
* decorative design.

The first version may use plain colours and system fonts.

## Suggested File Structure

A simple static structure might be:

```text
trivalent-graphs/
  index.html
  publications.html
  about.html

  projects/
    f4/
      index.html
      closed-graphs.html
      sources.html
      traces.html
      polynomial-obstruction.html

    e6/
      index.html
      sources.html
      reductions.html

    jordan-structures/
      index.html

  notes/
    index.html

  assets/
    css/
      site.css
    js/
      site.js
      catalogue.js

  projects/
    f4/
      cache/
        closed/
        sources/
        traces/
```

This can be revised later.  The key principle is that human-written pages, scripts, styles, and generated caches should have distinct roles.

## Layout Components

The first implementation should probably define reusable layout pieces:

* top bar;
* sidebar;
* main content wrapper;
* previous/next footer;
* catalogue viewer block.

If the site remains hand-written HTML, these may be copied between files at first.

If repetition becomes annoying, use a small static-site generator or a simple template step.

## Minimal First Target

The first working version should include:

1. a home page;
2. a top bar with Home, Publications, About;
3. a permanent left Contents sidebar;
4. one F4 chapter with several section links;
5. active-page highlighting;
6. previous/next navigation inside the F4 chapter;
7. one catalogue page loading a JSON cache;
8. MathJax working on pages that need mathematics.

This is enough to test whether the layout feels right.

## Later Enhancements

Possible later additions:

* right-hand "On this page" outline;
* site-wide search;
* collapsible sidebar chapters;
* automatic generation of navigation from a manifest file;
* improved graph rendering;
* downloadable cache links;
* BibTeX links for publications;
* tags for informal notes;
* comments or discussion links.

These should not block the first layout version.

## Design Principle

The site should make the mathematics feel organised.

The layout should help the reader answer three questions at all times:

1. Where am I?
2. What is the surrounding project?
3. What should I read next?

If the layout answers these questions, the first design goal has been met.
