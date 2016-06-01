## Build status

| [Linux][lin-link] |
| :---------------: |
| ![lin-badge]      |

[lin-badge]: https://travis-ci.org/nfactorial/game_state_js.svg?branch=master "Travis build status"
[lin-link]:  https://travis-ci.org/nfactorial/game_state_js "Travis build status"

Game State
==========
Code to manage the state of a game in a node.js server.

Normally I wouldn't recommend writing an actual game server in node,
but this is intended for use in simple games which should be okay.

This is available as an npm mmodule, to install:

```
npm install --save @nfactorial/game_state_js
```

Usage
=====
A running game is formed from a hierarchy of states, where each state
represents a running context of the title. During its operation a
title may switch contexts, this module offers a framework for managing
the running contexts of a title. We term a running context as a 'state'.

A game state, in itself, does not contain any logical processing.
Instead logical processing is placed into system objects, these objects
are assigned to the states within the hierarchy and are updated when
their parent states are considered active.

During operation, the currently active state may only be a lead node
(one without any children) however when a node is considered active
all parent nodes within its hierarchy are also considered active.

Game Systems
============
To implement a game system, a title should extend the GameSystem object
and override the necessary methods.

System Registration
===================
Once a title has its system objects implemented, it is necessary to
provide the systems to the state tree. This is done using factory_js
which is supplied as a separate module. Create an instance of the
factory and register the game systems, then pass the factory instance
to the constructor of the state tree.

```
const GameState = require('@nfactorial/game_state_js');
const Factory = require('@nfactorial/factory_js');

const myFactory = new Factory();

myFactory.register('mySystem', MySystem);
myFactory.register('system2', System2);

const stateTree = new GameState.StateTree(myFactory);
```

Once created, the state tree is capable of creating the registered
system objects. Systems are assigned to game states within the state
tree definition file (described below).

State Tree Definition
=====================
State trees are defined using a JSON formatted definition file and
supplied to the initialize method of the stateTree instance.

The definition file lists all the game states in the hierarchy as well
as their relationship to each other. It also specifies which systems
belong to each state.

```
{
    "name": "state_tree_name",
    "main": "child1",
    "states": [
        {
            "name": "main_state",
            "children": [
                "child1"
            ],
            "systems": [
                "ExampleSystem"
            ]
        },
        {
            "name": "child1",
            "systems": [
                "SecondSystem"
            ]
        }
    ]
}
```

In the above example, a state tree is defined that contains two
game states. The "name" entry provides a friendly name for the state
tree and the "main" property specifies the name of the game state
which the state system will default too when the tree has been created.
If no "main" property is specified, the state tree will select the
first leaf node it finds within the hierarchy. It is recommended that
this is specified explicitly.

"states" contains an array of state definitions. Each state contains
the following properties:

"name"
The name of the state, each state within a tree must have a unique name.

"children"
An array of strings that specifies which states are children of the state.
A state may only have one parent, if multiple states reference the same
child state initialization will fail.

"systems"
An array of strings that specify which game systems belong to the state,
the strings specify the name of the system object to be created and
should match the names which the systems were registered with inside
the factory object supplied to the state tree during construction.

Systems must be unique within a state tree, if the title wishes to use
multiple instances of the same system within the hierarchy it may
associate the system instance with a name. This is done by using an
object within the array rather than a raw string. For example, to
associate a system of type 'ExampleSystem' with the name 'foo':

```
"systems": [
    {
        "name": "foo",
        "type": "ExampleSystem"
    }
]
```

System Initialization
=====================
Once a state tree has been created and initialized, it will invoke the
onInitialize function for all systems it the hierarchy. Systems should
take this opportunity to prepare themselves for use by the title
however they should not perform any processing or consider themselves
active within the framework. The onInitialize method is supplied an
InitArgs object which provides additional support for system
initialization.

When the state tree is being destroyed, it will invoke the 'onDestroy'
method of all systems (whether active or inactive).

System Activation
=================
When control switches to a game state where a system is considered
'active' the systems 'onActivate' method is invoked. This signals to
the system that its 'onUpdate' method is about to begin being called
each frame update. The system object should take this opportunity to
setup itself for frame processing, for example this is where system
objects should subscribe to events.

When control switches to a game state where a system is no-longer
considered 'active' the systems 'onDeactivate' method is invoked. This
signals to the system that its 'onUpdate' method will no longer be
called each frame update. The system object should take this opportunity
to remove detach itself from any subscribed events.

Frame Update
============
During each frame update, when a system is considered active, the
state tree will invoke its onUpdate method. The onUpdate method
is supplied an instance of an UpdateArgs object, this object contains
properties and methods describing the current frame being processed.
Titles may extend the UpdateArgs object to provide their own
customizations. The basic UpdateArgs structure contains the following:

UpdateArgs.deltaTime
This property contains the amount of time (in seconds) that has
elapsed since the last time the frame was updated.

UpdateArgs.requestState()
This method allows systems to request a change in the titles active
game state within the hierarchy.

UpdateArgs.getSystem()
Retrieves a system object associated with the specified name. Only
system objects in the active hierarchy may be retrieved.