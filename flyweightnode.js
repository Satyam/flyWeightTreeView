/*jslint nomen: true, white: true, browser: true, maxerr: 100 */
/*global YUI */
/**
 * @module flyweightnode
 */
YUI.add('flyweightnode', function (Y, NAME) {
	var Lang = Y.Lang;
	
	var FWN = Y.Base.create(
		NAME,
		Y.Base,
		[],
		{
			_node:null,
			_getHTML: function() {
				var attrs = this.getAttrs(),
					s = '', 
					templ = this.get('template') || this.constructor.TEMPLATE || this.get('root').get('nodeTemplate');
				this.forEachChild( function (fwNode) {
					s += fwNode._getHTML();
				});
				attrs.children = s;
				if (!attrs.id) {
					this._set('id', attrs.id = Y.guid());
				}
				return Lang.sub(templ, attrs);
				
			},
			_slideTo: function (node) {
				this._node = node;
			},
			forEachChild: function(fn, scope) {
				var root = this.get('root'),
					children = this._node.children,
					child, ret;
				scope = scope || this;
				if (children && children.length) {
					Y.Array.each(children, function (node, index) {
						child = root._poolFetch(node);
						ret = fn.call(scope, child, index);
						root._poolReturn(child);
						return ret;
					});
				}
			}
		},
		{
			ATTRS: {
				root: {
					readOnly: true
				},
				template: {
					validator: Lang.isString,
					getter: function () {
						return this._node.template;
					},
					setter: function (value) {
						this._node.template = value;
					}
				},
				label: {
					validator: Lang.isString,
					getter: function () {
						return this._node.label;
					},
					setter: function (value) {
						this._node.label = value;
					}
				},
				id: {
					writeOnce: true,
					validator: Lang.isString,
					getter: function () {
						return this._node.id;
					},
					setter: function (value) {
						this._node.id = value;
					}
				}
			}
		}
	);
	Y.FlyweightNode = FWN;

}, '@VERSION@' ,
{
	requires: ['base-core', 'base-build']
});
