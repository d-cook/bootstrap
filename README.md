# Bootstrap
An attempt to bootstrap self-moldable software that is it's own self-contained language, runtime, editor, or whatever else you make it to be.

This is my "Frankenstein's monster" starting point (as [Alan Kay puts it](https://youtu.be/YyIQKBzIuBY?t=47m) 47:00 - 49:05) for reinventing various approaches to and applications of software. The plan is to (1) bootstrap the minimum mechanism (or minimal effort) needed to define, run, edit, and visualize all parts of itself, then (2) use the system to improve and/or bootstrap itself into better things (e.g. rapid development of _other_ "Franks"). There are limitless directions this can take, but one goal is to bootstrap the power of programming back into itself, and another is to empower non-programmers to make software work for _them_.

This _specific_ attempt starts with JavaScript/HTML/CSS as a "given" foundation -- but all in a single flat JavaScript file, since it all must be self-contained. No NPM or pacakges; just a very [simple VDOM](https://github.com/d-cook/vdom) implementation pasted directly into it. This is both a major shortcut for bootstrapping an initial system into existence, as well as having _immediate_ practicality for generating real-world software.

## Initial Implementation

This is my current plan for creating an initial (MVP) implementation of a self-hosted runtime that is tool of its own modification:

> KEY:
> <br>:white_large_square:    Not done
> <br>:ballot_box_with_check: Done enough for MVP
> <br>:white_check_mark:      Fully done, including all sub-tasks

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
3. :ballot_box_with_check: Bootstrap the UI/App as it exists up to this point
   - :white_check_mark:      Convert the entire app into a vdom view / editor + the data to be viewed
     - :white_check_mark:      Recode everything into a single top-level structure ("master context")
     - :white_check_mark:      Create view for that top-level structure (shows all entities created)
     - :white_check_mark:      Create view for the global CSS (also stored in top-level structure)
   - :white_check_mark:      Create the bootstrapper:
     - :white_check_mark:      A function that generates JS code which recreates the APP in its current state
     - :white_check_mark:      That code contains: all entites (hard-codeded), code to invoke the APP view
     - :white_check_mark:      Perhaps also auto-copy this JS into a <script> tag, so that simply saving the page creates a bootstrapping HTML doc
   - :white_large_square:    Make it easier to edit the running system without crashing it
     - :white_large_square:    A (temporary?) way to edit and test / toggle _copies_ of the system (or its code) within itself 

_At this point, further development is done within the running system itself, and "source code" files become auto-generated_

4. :white_large_square:    Create the self-running runtime
   - :white_large_square:    A data-representation of code and [an interpreter](https://github.com/d-cook/Interact) that runs such code
   - :white_large_square:    The interpreter & all operations are stored in the top-level structure (thus it can inspect and modify itself)
5. :white_large_square:    Migrate the system (thus far) into the runtime
   - :white_large_square:    Wrap the existing code (as-is) into a structure that the runtime can run
   - :white_large_square:    Modifiy the "bootstrapper" to invoke system initialization _via the interpreter_
6. :white_large_square:    Convert everything (app & runtime) into the interpreted representation
   - :white_large_square:    Create a better view for runtime data-representation of code
     - :white_large_square:    Either a nested-expressions view of the code...
       - My [original implementation](https://github.com/d-cook/Objects) was based on expression-lists that were easy enough to understand.
       - My [re-envisioned model](https://github.com/d-cook/Interact) is more powerful (e.g. a DAG with direct references), but not great in raw form.
       - There is a straightfoward way to convert the new DAG model into nested expressions
     - :white_large_square:    And/or make the DAG / sequence of instructions model more palpable:
       - :white_large_square:    Show names of referenced entities, rather than the numeric indexes that describe "where" they are
       - :white_large_square:    Code by clicking on which operation to perform and which entities to perform it on
   - :white_large_square:    Recode (nearly) everything to the new representation, verifying before ditching the old code
     - :white_large_square:    Including the interpreter, but don't delete the native interpreter just yet
7. :white_large_square:      Bootstrap the native runtime from itself
   - :white_large_square:      Create a compiler (function) that converts the new representation into JavaScript code'
     - :white_large_square:      Mainly just nested function-calls to existing (in-runtime) functions
     - :white_large_square:      Might recognize certain operators. Perhaps a mapping of op functions to syntax?
   - :white_large_square:      Provide a way to modify / recompile the interpreter without crashing the runtime
     - Build upon the "edit system without crashing it" solution, or make something similar?
   - :white_large_square:      Modify the boostrap-generator to:
     - :white_large_square:      Regenerate the native interpreter by compiling the new one
     - :white_large_square:      Inject the resulting native interpreter into the bootstrapper
     - :white_large_square:      Modify bootstrapper to invoke (then forget or delete) the native interpreter

_At this point, the runtime provides its own means (e.g. tools & language) for viewing, editing, and defining itself, or anything within it_

## Further development & exploration

Once the runtime is fully self-hosted (above), it can be utilized & adapted to explore new possibilities.

Here are just some of those possibilities:

#### Bootstrap the power of software into software development

It is ironic that software provides powerfully generative and dynamic tools & interfaces to do things that would be entirely impractical or impossible otherwise; while that same power is massively unutilized in the _development_ of that very same software. The software developer does not work with dynamic or generative models of the system they are created, but with rigourous textual _descriptions_ *of* dynamic and generative models.

One of the goals of this project is to address that problem by bootstrapping the generative & dynamic nature of software back into itself.

As an analogy, image a programming language or IDE in which the language, editor, modeling, etc of application code, could be specified within the application code _itself_. And recursively: specify a better (e.g. visually immediate) view / model for such specifications than is possible with just text.
   
#### Improve the runtime further

It would be incredibily irconic to develop a tool that bootstraps the generative power of software into itself (see previous section), without utilizing any of that power in the development of said tool.

Thus, the MVP is intentionally minimal and crude, so that that power can be utilized as early as possible to make the exploration of this space actually practical & achievable, both by immediately benefiting from any gain in representation / tooling / generative power / etc, and by demonstrating that practicality through direct experience and as a POC of the very thing being explored.

#### TODO: Make sections (as above) for the following:
   
   - Make better tools / alternatives to text-based "coding":
     - Operate on values by manipulating them as objects, and your actions as recorded as code
     - Boxes and arrows?
     - Code that generates other code (e.g. from some business model)
     - Explore other "language" models, e.g. static types
       - Enforced by UI instead of compiler (i.e. can only build valid structures)
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
