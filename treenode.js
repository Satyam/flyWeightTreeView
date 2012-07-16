/*jslint nomen: true, white: true, browser: true, maxerr: 100 */
/*global YUI *//**
 * @module treenode
 */
YUI.add('treenode', function (Y, NAME) {
	'use strict';
	
	var TN = Y.Base.create(
		NAME,
		Y.FlyweightNode,
		[],
		{
			
		},
		{
			TEMPLATE: '<li id="{id}" class="{cname_node}"><div class="toggle"></div><div class="icon"></div><div class="selected"></div><div class="content">{label}</div><ul class="{cname_children}">{children}</ul></li>',
			ATTRS: {
				
			}
			
		}
	);
		
	Y.TreeNode = TN;


}, '@VERSION@' ,
{
	requires: ['flyweightnode','base-build']
});
