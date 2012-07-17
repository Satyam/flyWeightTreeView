/*jslint nomen: true, white: true, browser: true, maxerr: 100 */
/*global YUI */
/**
 * An implementation of the flyweight pattern.  
 * This object can be slid on top of a literal object containing the definition 
 * of a tree and will take its state from that node it is slid upon.
 * It relies for most of its functionality on the flyweight manager object,
 * which contains most of the code.
 * @module flyweight
 * @submodule flyweightnode
 * @main flyweightmanager
 */
YUI.add('flyweightnode', function (Y, NAME) {
	'use strict';

	// TODO add expanded attribute and rendering
	// TODO add method for locating children container
	var Lang = Y.Lang,
		FWM = Y.FlyweightManager;
	/**
	 * An implementation of the flyweight pattern.  This class should not be instantiated directly.
	 * Instances of this class can be requested from the flyweight manager class
	 * @class FlyweightNode
	 * @extends Y.Base
	 * @constructor  Do instantiate directly.
	 */
	var FWN = Y.Base.create(
		NAME,
		Y.Base,
		[],
		{
			/**
			 * Reference to the node in the configuration tree it has been slid over.
			 * @property _node
			 * @type {Object}
			 * @private
			 **/
			_node:null,
			/**
			 * Returns a string with the markup for this node along that of its children
			 * produced from its attributes rendered
			 * via the first template string it finds in these locations:
			 *
			 * * It's own {{#crossLink "template"}}{{/crossLink}} configuration attribute
			 * * The static {{#crossLink "FlyweightNode/TEMPLATE"}}{{/crossLink}} class property
			 * * The {{#crossLink "FlyweightManager/nodeTemplate"}}{{/crossLink}} attribute in the root object
			 *
			 * @method _getHTML
			 * @return {String} markup generated by this node
			 * @protected
			 */
			_getHTML: function() {
				// assumes that if you asked for the HTML it is because you are rendering it
				this._node._rendered = true;
				var attrs = this.getAttrs(),
					s = '', 
					templ = this.get('template') || this.constructor.TEMPLATE || this.get('root').get('nodeTemplate');
				if (this.get('expanded')) {
					this._node._childRendered = true;
					this.forEachChild( function (fwNode) {
						s += fwNode._getHTML();
					});
				}
				attrs.children = s;
				attrs.cname_node = FWM.CNAME_NODE;
				attrs.cname_children = FWM.CNAME_CHILDREN;
				
				return Lang.sub(templ, attrs);
				
			},
			/**
			 * Method to slide this instance on top of another node in the configuration object
			 * @method _slideTo
			 * @param node {Object} node in the underlying configuration tree to slide this object on top of.
			 * @private
			 */
			_slideTo: function (node) {
				this._node = node;
			},
			/**
			 * Executes the given function on each of the child nodes of this node.
			 * @method forEachChild
			 * @param fn {Function} Function to be executed on each node
			 *		@param child {Y.FlyweightNode} Instance of a suitable subclass of FlyweightNode, 
			 *		positioned on top of the child node
			 *		@param index {Integer} Index of this child within the array of children
			 * @param scope {object} The falue of this for the function.  Defaults to the parent.
			**/
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
			},
			/**
			 * Getter for the expanded configuration attribute.
			 * It is meant to be overriden by the developer.
			 * The supplied version defaults to true if the expanded property 
			 * is not set in the underlying configuration tree.
			 * It can be overriden to default to false.
			 * @method _getExpanded
			 * @return {Boolean} The expanded state of the node.
			 * @protected
			 */
			_getExpanded: function () {
				return this._node.expanded !== false;
			},
			/**
			 * Setter for the expanded configuration attribute.
			 * It renders the child nodes if this branch has never been expanded.
			 * Then sets the className on the node to the static constants 
			 * CNAME\_COLLAPSED or CNAME\_EXPANDED from Y.FlyweightManager
			 * @method _setExpanded
			 * @param value {Boolean} new value for the expanded attribute
			 * @private
			 */
			_setExpanded: function (value) {
				this._node.expanded = value = !!value;
				if (value && !this._node._childRendered) {
					this.forEachChild(function (fwNode) {
						// TODO render the nodes
					});
				}
				var n = Y.one('#' + this.get('id'));
				if (value) {
					n.replaceClass(FWM.CNAME_COLLAPSED, FWM.CNAME_EXPANDED);
				} else {
					n.replaceClass(FWM.CNAME_EXPANDED, FWM.CNAME_COLLAPSED);
				}
			},
			/**
			 * Sugar method to toggle the expanded state of the node.
			 * @method toggle
			 * 
			 */
			toggle: function() {
				this.set('expanded', !this.get('expanded'));
			}
		},
		{
			/**
			 * Template string to be used to render this node.  
			 * It contains the HTML markup for this node plus placeholders,
			 * enclosed in curly braces, that have access to any of the 
			 * configuration attributes of this node plus the following
			 * additional placeholders:
			 * 
			 * * children: The markup for the children of this node will be placed here
			 * * cname_node: The className for the HTML element enclosing this node.
			 *   The template should always use this className to help it locate the DOM element for this node.
			 * * cname_children: The className for the HTML element enclosing the children of this node.
			 * The template should always use this className to help it locate the DOM element that contains the children of this node.
			 * 
			 * The template should also add the id attribute to the DOM Element representing this node. 
			 * @property TEMPLATE
			 * @type {String}
			 * @static
			 */
			TEMPLATE: null,
			ATTRS: {
				/**
				 * Reference to the FlyweightManager this node belongs to
				 * @attribute root
				 * @type {Y.FlyweightManager}
				 * @readOnly
				 * 
				 */
				
				root: {
					readOnly: true
				},
				/**
				 * Template to use on this particular instance.  
				 * The renderer will default to the static TEMPLATE property of this class 
				 * (the preferred way) or the nodeTemplate configuration attribute of the root.
				 * See the TEMPLATE static property.
				 * @attribute template
				 * @type {String}
				 * @default undefined
				 */
				template: {
					validator: Lang.isString,
					getter: function () {
						return this._node.template;
					},
					setter: function (value) {
						this._node.template = value;
					}
				},
				/**
				 * Label for this node. Nodes usually have some textual content, this is the place for it.
				 * @attribute label
				 * @type {String}
				 * @default ''
				 */
				label: {
					validator: Lang.isString,
					getter: function () {
						return this._node.label || '';
					},
					setter: function (value) {
						this._node.label = value;
					}
				},
				/**
				 * Id to assign to the DOM element that contains this node.  
				 * If none is supplied, it will generate one
				 * @attribute id
				 * @type {Identifier}
				 * @default Y.guid()
				 */
				id: {
					validator: Lang.isString,
					getter: function () {
						var id = this._node.id;
						if (!id) {
							id = this._node.id = Y.guid();
						}
						return id;
					},
					setter: function (value) {
						if (this._node.id) {
							return Y.Attribute.INVALID_VALUE;
						}
						return (this._node.id = value);
					}
				},
				/**
				 * Expanded state of this node.
				 * @attribute expanded
				 * @type Boolean
				 * @default true
				 */
				expanded: {
					getter: '_getExpanded',
					setter: '_setExpanded'
				}
			}
		}
	);
	Y.FlyweightNode = FWN;

}, '@VERSION@' ,
{
	requires: ['base', 'base-build']
});
