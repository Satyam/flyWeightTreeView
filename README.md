flyWeightTreeView
=================

An implementation of a YUI3 TreeView based on the FlyWeight pattern

Described mostly in these posts:

http://yuilibrary.com/forum/viewtopic.php?p=33740#p33740

http://yuilibrary.com/forum/viewtopic.php?p=33743#p33743

---------------------------
This demo also contains a sample on how to use this same mechanism to create a form, form fields and group of fields

------------------------------
The demo is self-contained except for the YUI files that it downloads from the internet.  You just need to browse the index.html file to see it working.


----
Issue:

The click event (one of many events) adds the resolved node to the event facade of the click event so the listeners further down in the chain can benefit from it.
However, the click event of FlyweightManager is called after the classes it extends so the object is not ready for their on events, though it is for their after events.

It would be good to have the on and after events of the extension to enclose the on and after events of the objects it is extending.

