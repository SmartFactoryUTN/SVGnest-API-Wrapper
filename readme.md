# [SVGNest Readme](https://github.com/Jack000/SVGnest?tab=readme-ov-file#what-is-nesting)

## Usage

- Node JS >= 10
- NPM

1. From the project dir, run the command `node index.js`
2. Execute a POST request to `http://localhost:3000/` with this payload
    ```
    {
      "svgBin": "<svg width='2000' height='2000' xmlns='http://www.w3.org/2000/svg' viewBox='0 0 2048 2048'><path fill='none' d='M278 589 275 590 269 593 269 596 271 600 271 602 273 605 273 607 275 610 275 612 278 617 279 620 280 623 281 626 281 628 282 631 283 635 285 638 285 640 287 644 289 646 291 651 293 653 301 669 301 671 304 676 304 678 306 681 307 684 308 687 309 690 310 693 311 697 312 701 313 706 314 712 314 725 314 728 314 741 313 747 312 752 311 756 310 759 309 762 308 765 307 768 306 771 303 776 303 778 299 786 297 788 295 793 293 795 292 798 290 801 288 804 286 807 283 811 279 816 275 821 255 841 249 845 245 848 243 851 240 856 236 861 220 876 221 878 227 890 229 892 230 895 232 898 235 902 247 914 250 916 256 919 259 920 263 921 271 921 275 920 278 919 281 918 285 916 287 914 290 913 294 910 298 907 305 901 320 886 328 877 334 870 339 864 343 859 346 855 350 850 353 846 356 842 358 839 361 835 363 832 365 829 367 826 369 823 371 820 373 817 374 814 376 812 377 809 379 807 388 789 388 787 390 784 390 782 392 779 393 776 394 773 395 769 396 765 397 759 398 750 398 739 397 730 396 725 395 721 394 717 393 714 392 711 391 708 390 705 388 702 388 700 384 693 384 691 383 689 381 687 377 678 375 676 374 673 372 670 370 667 368 665 367 662 364 658 362 655 360 652 357 648 354 644 350 639 346 634 341 628 331 617 325 611 316 603 312 600 308 597 305 595 297 591 294 590 291 589 ' style='stroke:pink'/></svg>",
      "svgParts": "<svg width='2000' height='2000' xmlns='http://www.w3.org/2000/svg' viewBox='0 0 2048 2048'><polygon fill='none' stroke='#010101' stroke-miterlimit='10' points='1031.068,566.961 1031.068,577.655 1043.723,577.965 1044.294,568128 ' /><polygon fill='none' stroke='#010101' stroke-miterlimit='10' points='582.528,372.964 624.57,373.468 631.906,347.062 620.936,326.309 609.533,329.092 592.663,309.654 560.571,335.878 ' /><polygon fill='none' stroke='#010101' stroke-miterlimit='10' points='661.185,157.016 652.101,203.035 718.574,209.716 734.568,180.887 ' /><polygon fill='none' stroke='#010101' stroke-miterlimit='10' points='1057.909,602.939 1049.363,604.521 1043.723,597.907 1046.628,589.714 1055.174,588.14 1060.814,594.753 ' /></svg>",
      "iterationCount": "35"
    }
    ```
3. The resulting SVG will appear in `download` folder, it can be rendered in html. 
## Outline of algorithm

While [good heuristics](http://cgi.csc.liv.ac.uk/~epa/surveyhtml.html) exist for the rectangular bin packing problem, in the real world we are concerned with irregular shapes.

The strategy is made of two parts:

- the placement strategy (ie. how do I insert each part into a bin?)
- and the optimization strategy (ie. what's the best order of insertions?)

### Optimization