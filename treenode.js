/*jslint nomen: true, white: true, browser: true, maxerr: 100 */
/*global YUI *//**
 * @module treenode
 */
YUI.add('treenode', function (Y, NAME) {
	'use strict';
	var Lang = Y.Lang,
		DOT = '.',
		getCName = Y.ClassNameManager.getClassName,
		cName = function (name) {
			return getCName(NAME, name);
		},
		CNAMES = {
			toggle: cName('toggle'),
			icon: cName('icon'),
			selection: cName('selection'),
			content: cName('content')
		};
		
	var TN = Y.Base.create(
		NAME,
		Y.FlyweightNode,
		[],
		{
			initializer: function() {
				this.after('click', this._afterClick, this);
			},
			_afterClick: function (ev) {
				console.log('after click', ev, this);
				this.toggle();
			}

			
		},
		{
			TEMPLATE: Lang.sub('<li id="{id}" class="{cname_node}"><div class="{toggle}"></div><div class="{icon}"></div><div class="{selection}"></div><div class="{content}">{label}</div><ul class="{cname_children}">{children}</ul></li>', CNAMES),
			ATTRS: {
				
			}
			
		}
	);
		
	Y.TreeNode = TN;


}, '@VERSION@' ,
{
	requires: ['flyweightnode','base-build']
});
