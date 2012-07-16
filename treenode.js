/*jslint nomen: true, white: true, browser: true, maxerr: 100 */
/*global YUI *//**
 * @module treenode
 */
YUI.add('treenode', function (Y, NAME) {
	
	var TN = Y.Base.create(
		NAME,
		Y.FlyweightNode,
		[],
		{
			
		},
		{
			TEMPLATE: '<li id="{id}" class="node"><div class="toggle"></div><div class="icon"></div><div class="selected"></div><div class="content">{label}</div><ul>{children}</ul></li>',
			ATTRS: {
				
			}
			
		}
	);
		
	Y.TreeNode = TN;


}, '@VERSION@' ,
{
	requires: ['flyweightnode','base-build']
});
