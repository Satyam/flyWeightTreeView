/**
 * @module flyweightmanager
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
				var s = '<ul>', templ = this.get('template') || FWN.TEMPLATE || this.get('root').get('nodeTemplate');
				this.forEachChild( function (fwNode) {
					s += fwNode._getHTML();
				})
				return '<li>' + Lang.sub(templ, this._node) + s + '</ul></li>';
				
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
					validator: Lang.isString
				}
			}
		}
	);
	Y.FlyweightNode = FWN;

}, '@VERSION@' ,
{
	requires: ['base-core', 'base-build']
});
