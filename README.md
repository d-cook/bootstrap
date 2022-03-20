# Bootstrap
An attempt to bootstrap self-moldable software that is it's own self-contained language, runtime, editor, or whatever else you make it to be.

This is my "Frankenstein's monster" starting point (as [Alan Kay puts it](https://youtu.be/YyIQKBzIuBY?t=47m) 47:00 - 49:05) for reinventing various approaches to and applications of software. The plan is to (1) bootstrap the minimum mechanism (or minimal effort) needed to define, run, edit, and visualize all parts of itself, then (2) use the system to improve and/or bootstrap itself into better things (e.g. rapid development of _other_ "Franks"). There are limitless directions this can take, but one goal is to bootstrap the power of programming back into itself, and another is to empower non-programmers to make software work for _them_.

This _specific_ attempt starts with JavaScript/HTML/CSS as a "given" foundation -- but all in a single flat JavaScript file, since it all must be self-contained. No NPM or pacakges; just a very [simple VDOM](https://github.com/d-cook/vdom) implementation pasted directly into it. This is both a major shortcut for bootstrapping an initial system into existence, as well as having _immediate_ practicality for generating real-world software.

## Current Plan
1. :white_check_mark:      Make a [simple virtual DOM engine](https://github.com/d-cook/vdom) that can be a self-contained part of this app
2. :ballot_box_with_check: Create a simple vdom view / editor for each type of data:
   - :white_check_mark:      Single values like numbers, strings, booleans, null
   - :ballot_box_with_check: Compound values like lists (arrays) and records (objects)
     - :white_check_mark:      Add/remove entries
     - :white_check_mark:      Prevent infinitely nested cycles
     - :ballot_box_with_check: Edit raw JSON
     - :white_large_square:    Collapsible
     - :white_large_square:    Insert / extract existing entities
   - :white_check_mark:      Dynamic fields (map any value to the appropriate view)
   - :white_check_mark:      Functions
     - :white_check_mark:      _And_ preserve references across functions (via a master context object)
3. :white_check_mark:      Bootstrap the UI/App as it exists up to this point
   - :white_check_mark:      Convert the entire app into a vdom view / editor + the data to be viewed
     - :white_check_mark:      Recode everything into a single top-level structure ("master context")
     - :white_check_mark:      Create view for that top-level structure (shows all entities created)
     - :white_check_mark:      Create view for the global CSS (also stored in top-level structure)
   - :white_check_mark:      Create the bootstrapper:
     - :white_check_mark:      A function that generates JS code which recreates the APP in its current state
     - :white_check_mark:      That code contains: all entites (hard-codeded), code to invoke the APP view
     - :white_check_mark:      Perhaps also auto-copy this JS into a <script> tag, so that simply saving the page creates a bootstrapping HTML doc

_At this point, any further development can be done via the running App itself_

4. :white_large_square:    Create the self-running runtime
<br>(not as hard as it sounds; I've done this before)
   - :white_large_square:    A data-representation of code and [an interpreter](https://github.com/d-cook/Interact) that runs such code
   - :white_large_square:    The interpreter & all operations are stored in the top-level structure (thus it can inspect and modify itself)
5. :white_large_square:    Convert everything (app & runtime) into the interpreted representation
   - :white_large_square:    First, create a better view for this kind of code
     - :white_large_square:    Either a nested-expressions view of the code...
       - My [original implementation](https://github.com/d-cook/Objects) was based on expression-lists that were easy enough to understand.
       - My [re-envisioned model](https://github.com/d-cook/Interact) is more powerful (e.g. a DAG with direct references), but not great in raw form.
       - There is a straightfoward way to convert the new DAG model into nested expressions
     - :white_large_square:    And/or make the DAG / sequence of instructions model more palpable:
       - :white_large_square:    Show names of referenced entities, rather than the numeric indexes that describe "where" they are
       - :white_large_square:    Code by clicking on which operation to perform and which entities to perform it on
   - :white_large_square:    Recode (nearly) everything into the interpreted representation of code
     - All code in the app will now be run by the interpreter (the boostrapper gets this going)
   - :white_large_square:    Convert the interpreter itself into the interpreted representation:
     - :white_large_square:    Do the conversion, but don't replace the JavaScript version of it yet
     - :white_large_square:    Create a compiler (function) that converts expressions into JavaScript code
     - :white_large_square:    Compile the converted intpreter back to JavaScript from the interpreted representation
     - :white_large_square:    Ensure that the re-generated JavaScript interpreter works as it did before
     - :white_large_square:    Modify the bootstrap-generator compile the interpreter and inject the result into the bootstrap code
     - :white_large_square:    Test the bootstrap to ensure the app works the same after being re-bootstrapped

_At this point, further development is done in the new code representation rather than JavaScript_

5. Explore the possibilities from here:
   - Make better tools / alternatives to text-based "coding":
     - Operate on values by manipulating them as objects, and your actions as recorded as code
     - Boxes and arrows?
     - Code that generates other code (e.g. from some business model)
   - Drag & drop editor for HTML / VDOM / CSS
   - Drag & drop shapes to create SVG images / graphics
   - Evolving this system / App:
     - Since everything about it is modifiable within itself, you can mold it into a totally different paradigm or system
     - Bootstrap the system to a different language or platform (assembly, JVM, CLR, etc.)
       - The only parts that are "native code" are:
         - Basic operations (+, -, if, etc)
         - Some implementation of lists & records (you get this for free in JavaScript)
         - Basic graphics commands (e.g. VDOM, SVG, or some other "line here, box there" model)
         - The code that the compiler outputs as the native equivalent of invoking a function
       - Recode (copy) _just_ the native code for those parts for some other platform
       - Run the bootstrap-generator using _that_ spec, and run the resulting output on the new platform
       - BOOM! The same app is now running (exactly as you left it) on that other platform.
     - This running system can serialize itself and transfer itself over the wire (e.g. HTTP)
