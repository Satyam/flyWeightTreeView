/*jslint nomen: true, white: true, browser: true, maxerr: 100 */
/*global YUI */
/**
 * @module treeview
 */
YUI.add('treeview', function (Y, NAME) {
	'use strict';
	var CBX = 'contentBox';

	var TV = Y.Base.create(
		NAME,
		Y.Widget,
		[Y.FlyweightManager],
		{
			initializer: function (config) {
				this._loadConfig(config.tree);
			},
			renderUI: function () {
				this.get(CBX).setContent(this._getHTML());
			}
			
		},
		{
			ATTRS: {
				defaultType: {
					value: 'TreeNode'
				}
				
			}
			
		}
	);
		
	Y.TreeView = TV;
	
}, '@VERSION@' ,
{
	requires: ['flyweightmanager', 'widget','base-build', 'treenode']
});
