# Bootstrap
An attempt to bootstrap self-moldable software that is it's own self-contained language, runtime, editor, or whatever else you make it to be.

The big picture is to (1) bootstrap such a system that contains the minimum mechanism needed (no matter how crude) to define, run, edit, and visualize all parts of itself "down to the 'metal'", and then (2) use that system to improve itself and/or morph it into something better. What that means depends on what it's used for, which could be anything. But one of my goals is to bootstrap the generative power of software back into the process of making software (vs manually written textual code). Another is to make software like clay that anybody can mold to whatever is possible -- like building with legos, rather than having to become a programmer.

This _specific_ attempt (I have others) builds on web technologies (JavaScript, HTML, CSS) as a "given" foundation of software, (1) because it's become so ubiquitous that it's hard to go wrong there, and (2) because that has _immediate_ practicality for making real world software using mainstream technologies. In order for this (i.e. the inital app / tool I am making here) to be fully self-contained and self-describing, everything must be implemented _without_ the usual NPM paraphanalia of packages, transpilers, etc -- just plain old JavaScript loaded directly from a flat file.

## Current Plan
1. Make a [simple virtual DOM engine](https://github.com/d-cook/vdom) that can be a self-contained part of this app
2. Create a simple vdom view / editor for each type of data:
   - Single values like numbers, strings, booleans, null
   - Compound values like lists (arrays) and records (objects)
     - Add/remove entries; collapsible; insert/extract other existing entities; clone (deep copy)
   - Functions
     - How to preserve references? Pass a master context that contains everything?
   - Dynamic fields (raw JSON <--> whatever view is appropriate)
3. Bootstrap the UI/App as it exists up to this point
   - Convert the entire app into a vdom view / editor + the data to be viewed
     - Recode everything into a single top-level structure ("master context")
     - Create view for that top-level structure (shows all entities created)
     - Create view for the global CSS (also stored in top-level structure)
   - Create the bootstrapper:
     - A function that generates JS code which recreates the APP in its current state
     - That code contains: all entites (hard-codeded), code to invoke the APP view
     - Perhaps also auto-copy this JS into a <script> tag, so that simply saving the page creates a bootstrapping HTML doc

_At this point, any further development can be done via the running App itself_

4. Create the self-running runtime
<br>(not as hard as it sounds; I've done this simply, and many times)
   - A data-representation of code and [an interpreter](https://github.com/d-cook/Interact) that runs such code
   - The interpreter & all operations are stored in the top-level structure (thus it can inspect and modify itself)
5. Convert everything (app & runtime) into the interpreted representation
   - First, create a better view for this kind of code
     - Either a nested-expressions view of the code...
       - My [original implementation](https://github.com/d-cook/Objects) was based on expression-lists that were easy enough to understand.
       - My [re-envisioned model](https://github.com/d-cook/Interact) is more powerful (e.g. a DAG with direct references), but not great in raw form.
       - There is a straightfoward way to convert the new DAG model into nested expressions
     - And/or make the DAG / sequence of instructions model more palpable:
       - Show names of referenced entities, rather than the numeric indexes that describe "where" they are
       - Code by clicking on which operation to perform and which entities to perform it on
   - Recode (nearly) everything into the interpreted representation of code
     - All code in the app will now be run by the interpreter (the boostrapper gets this going)
   - Convert the interpreter itself into the interpreted representation:
     - Do the conversion, but don't replace the JavaScript version of it yet
     - Create a compiler (function) that converts expressions into JavaScript code
     - Compile the converted intpreter back to JavaScript from the interpreted representation
     - Ensure that the re-generated JavaScript interpreter works as it did before
     - Modify the bootstrap-generator compile the interpreter and inject the result into the bootstrap code
     - Test the bootstrap to ensure the app works the same after being re-bootstrapped

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
