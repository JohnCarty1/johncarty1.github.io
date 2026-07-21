ORBIT PAGE — FIREBIRD / HPC REVISION
========================================

Replace these files in the repository root:
- index.html
- orbits.html
- style.css

Add/replace this folder in the repository root:
- orbit_assets/

Important correction:
- The animation is now identified as a conceptual magnetic-mirror orbit, not a trajectory produced from the imported WHAM fields.
- The quantitative figures and production results are explicitly described as coming from the separate full-orbit model using actual WHAM magnetic-field data.

New project information included:
- Parallelized independent orbit integrations
- Production parameter sweeps on Swarthmore's Firebird HPC cluster
- 41,310-orbit spatial birth-location scan
- 65,600 velocity-space integrations across two boundary/source cases
- More than 100,000 full-orbit integrations across those two production studies

The orbit video files were renamed for accuracy:
- orbit_assets/conceptual_mirror_orbit.mp4
- orbit_assets/conceptual_mirror_orbit_poster.jpg

The old inaccurate filenames can be removed from the repository if they were previously added:
- orbit_assets/confined_orbit_wham.mp4
- orbit_assets/confined_orbit_wham_poster.jpg


LAYOUT FIX V2
- Reworked the 19% → <1% result into three separately sized grid elements.
- Increased the result column width and stacks the banner below 920 px.
- This prevents the number from entering the explanatory text at desktop and tablet widths.
