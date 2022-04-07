# Bootstrap
An attempt to bootstrap self-moldable software that is it's own self-contained language, runtime, editor, or whatever else you make it to be.

This is my "Frankenstein's monster" starting point (as [Alan Kay puts it](https://youtu.be/YyIQKBzIuBY?t=47m) 47:00 - 49:05) for reinventing various approaches to and applications of software. The plan is to (1) [bootstrap the minimum mechanism](#initial-implementation) (or minimal effort) needed to define, run, edit, and visualize all parts of itself, then (2) use that system to [improve and/or bootstrap itself into better things](#further-development--exploration) (e.g. rapid development of _other_ "Franks").

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

_At this point, further development is done within the running system itself. "Source files" become auto-generated._

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

8. With the MVP now complete, use it as it's [own vehicle](#use-the-runtime-to-modify-itself-further) for [further development and exploration](#further-development--exploration)

## Further development & exploration

Once the runtime is fully self-hosted (above), it can be utilized & adapted to explore new possibilities.

The possibilities are potentially limitless, but here are some that I have in mind:

#### Use the runtime to modify itself further

It would be incredibily irconic to develop a tool that bootstraps the generative power of software into itself, without utilizing any of that power in the development of said tool. Thus, the MVP is intentionally minimal and crude, so that that power can be utilized as early as possible to make further development & exploration more practical & achievable.

With the MVP complete, any changes in representation, tooling, generativity, etc. can be immediately utilized _as they come_, while also serving as an immediately observable a proof of concept (POC) for how they improve further development of themselves and/or other things.

There are many directions this can take, but options can be explored in parallel because:
- The runtime be used to create & test separate implementations of itself or whatever else
- Alternate runtimes (or other things) can be sandboxed (i.e. run & tested in isolation)
- Changes can be done programmatically, and anything can be programmatically generated
- The runtime can be swapped out piece-by-piece OR wholesale with something else, while running
- The runtime can be copied or regenerated at a whim, along with anything within it at the time

Some of the specific directions that can be taken:
- Transfer the runtime to different platforms (e.g. languages / runtimes)
  - The only "native code" needed for each is basic operators (+, -, if, etc), some implementation of lists & records, basic graphics commands (e.g. VDOM, SVG, or like boxes & lines), and the native equivalent of invoking a function.
  - By providing a different set of those per language or platform, and feeding the right one into the bootstrapper, the entire runtime can be loaded onto another platform exactly as it was before
- Ability for the runtime to serialize & send itself over the wire (e.g. HTTP)

#### Bootstrap the power of software back into software development

Software provides powerfully generative and dynamic tools & interfaces to do things that would be entirely impractical or impossible otherwise. Ironically, that same power is massively unutilized in the _development_ of said software. Instead of dynamic or generative representations, the software developer works with static, rigourously _written out descriptions_ **of** those dynamic and generative models.

This is a limitation of "programming languages", wherein the representation of software and the runtime implications of that representation, are governed by set-in-stone limitations of a system outside of your control (e.g. a compiler or runtime). Creating a new language only shifts the problem: coding up an entire compiler or runtime is a lot of extra work that must be done in (and under the limitations of) some other already existing language. And then you are _still_ stuck with a set-in-stone limitations, albeit ones you can change through rigorous more modification.

An alternative is to replace (or supplement) "source code" with whatever "living" (running) representations, models, etc. that best (i.e. more simply or directly) convey what the software "is" and "does", along with whatever (also "live") tools, interfaces, views, etc. that best allow the developer to work with (e.g. modify, generate, query, test) those models. A fully self-running live-representation allows such things to be defined in terms of themselves or each other, without ultimately falling back on rigorously written out textual descriptions that are just shifted up level.

Here are some _general_ coding alternatives I am considering:
- Operate on values by manipulating them as objects, and your actions as recorded as code
- Data as static lists / boxes, and arrows showing where (and when) the data flows and how it is combined
- Generate code from some other domain- or application-specific model (not generalizable)
- "Static types" enforced by UI instead of compiler (i.e. can only build valid structures)
- Drag & drop editor for HTML / VDOM / CSS
- Drag & drop shapes to create SVG images / graphics
- Create a common implementation (library) of many things, and a general way to compile it down whatever language
- Create a "live" model of "code" for some _other_ language or system:
  - The "code" is an AST (or something better), and can be programmatically edited
  - Define values, logic, feature flags, etc. in _one common place_, and then programmatically apply it to "code" that targets different languages or servers
  - The representation of the "code" can be interpretable here; testing hooks / fakes injected in ways not actually possible the "real" language
  - An operation to "build it out" (generate the "actual" source code)
  - Need to edit "generated" code? Sure, that can be done programmatically as well
    - Not a specific line number/etc; but the code-equivalent of "the while-loop in that one function that does that thing"

#### Empower non-programmers

(TODO: This section better)

Instead of the apps & tools handed to us, what if we could literally grab API for our own personal accounts and hook them up to our own logic, drag and drop style? Assuming tools are made to make this tennable.

Brett Victor's idea: Just as literacy (writing, composing, etc) as a revolution for human development, the ability to freely create "computer stuff" could be a new kind of literacy. Instead of words, if people could just create runnable / working virtual models with their hands, and send or share them freely. This might require a new kind of "computing medium" -- Work on creating some such model or software tools for this. For one thing, instead of "apps", how about "objects"? Just like you can pick up a rock or frog and move it somewhere else, why not do the same with a computer "thing"? This requires a way for each thing to "run itself". This both describes this project here, _and_ how biology works: Why is a cell "alive" and a virus "not alive" (debatable)? The virus has "code" and can "duplicate itself", etc, but it is not its own "execution environment" - that is, it cannot "run itself". But that is what make s a living cell: It contains a coded representation of all parts of itself (or of all parts of things from which the rest of itself is generated). It contains all machinery needed to "run" that code (e.g. copy, synthesize protiens, etc), to duplicate itself, etc. And all those mechanisms are also accounted for in the code (DNA). The "environment" in which this happens has a defined boundary / container (cell membrane), and everything inside (including the boundary) "IS" the living thing. The boundary also acts as an interface through which the thing and the outside world interact. It is self-contained, self-running, self-defined, and therefore "alive" _in and of itself_. WHy does this matter? because all the things biology can do and has achieved, that computer science is still figuring out. And this is how it does it.
