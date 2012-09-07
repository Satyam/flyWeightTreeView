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

	var Lang = Y.Lang,
		YArray = Y.Array,
		FWM = Y.FlyweightManager,
	/**
	 * An implementation of the flyweight pattern.  This class should not be instantiated directly.
	 * Instances of this class can be requested from the flyweight manager class
	 * @class FlyweightNode
	 * @extends Y.Base
	 * @constructor  Do instantiate directly.
	 */
		FWN = Y.Base.create(
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
				 * Reference to the TreeView instance this node belongs to.
				 * It is set by the root and should be considered read-only.
				 * @property _root
				 * @type Y.FlyweightManager
				 * @private
				 */
				_root: null,
				/**
				 * Returns a string with the markup for this node along that of its children
				 * produced from its attributes rendered
				 * via the first template string it finds in these locations:
				 *
				 * * It's own {{#crossLink "template"}}{{/crossLink}} configuration attribute
				 * * The static {{#crossLink "FlyweightNode/TEMPLATE"}}{{/crossLink}} class property
				 *
				 * @method _getHTML
				 * @param index {Integer} index of this node within the array of siblings
				 * @param nSiblings {Integer} number of siblings including this node
				 * @param depth {Integer} number of levels to the root
				 * @return {String} markup generated by this node
				 * @protected
				 */
				_getHTML: function(index, nSiblings, depth) {
					// assumes that if you asked for the HTML it is because you are rendering it
					var self = this,
						// this is a patch until this:  http://yuilibrary.com/projects/yui3/ticket/2532712  gets fixed.
						getAttrs = function() {
							var o = {},
							i, l, attr,
 
							attrs = Y.Object.keys(self._state.data);
 
							for (i = 0, l = attrs.length; i < l; i+=1) {
								attr = attrs[i];
								o[attr] = self.get(attr);
							}
 
							return o;
						},
						node = this._node,
						attrs = getAttrs(),
						s = '', 
						templ = node.template || this.constructor.TEMPLATE,
						childCount = node.children && node.children.length,
						nodeClasses = [FWM.CNAME_NODE];

					node._rendered = true;
					if (childCount) {
						if (attrs.expanded) {
							node._childrenRendered = true;
							this.forEachChild( function (fwNode, index, array) {
								s += fwNode._getHTML(index, array.length, depth+1);
							});
							nodeClasses.push(FWM.CNAME_EXPANDED);
						} else {
							nodeClasses.push(FWM.CNAME_COLLAPSED);
						}
					} else {
						if (this._root.get('dynamicLoader') && !node.isLeaf) {
							nodeClasses.push(FWM.CNAME_COLLAPSED);
						} else {
							nodeClasses.push(FWM.CNAME_NOCHILDREN);
						}
					}
					if (index === 0) {
						nodeClasses.push(FWM.CNAME_FIRSTCHILD);
					} else if (index === nSiblings - 1) {
						nodeClasses.push(FWM.CNAME_LASTCHILD);
					}
					attrs.children = s;
					attrs.cname_node = nodeClasses.join(' ');
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
				 *		@param fn.child {Y.FlyweightNode} Instance of a suitable subclass of FlyweightNode, 
				 *		positioned on top of the child node
				 *		@param fn.index {Integer} Index of this child within the array of children
				 *		@param fn.array {Array} array containing itself and its siblings
				 * @param scope {object} The falue of this for the function.  Defaults to the parent.
				**/
				forEachChild: function(fn, scope) {
					var root = this._root,
						children = this._node.children,
						child, ret;
					scope = scope || this;
					if (children && children.length) {
						YArray.each(children, function (node, index, array) {
							child = root._poolFetch(node);
							ret = fn.call(scope, child, index, array);
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
				 * @method _expandedGetter
				 * @return {Boolean} The expanded state of the node.
				 * @protected
				 */
				_expandedGetter: function () {
					return this._node.expanded !== false;
				},
				/**
				 * Setter for the expanded configuration attribute.
				 * It renders the child nodes if this branch has never been expanded.
				 * Then sets the className on the node to the static constants 
				 * CNAME\_COLLAPSED or CNAME\_EXPANDED from Y.FlyweightManager
				 * @method _expandedSetter
				 * @param value {Boolean} new value for the expanded attribute
				 * @private
				 */
				_expandedSetter: function (value) {
					var self = this,
						node = self._node,
						root = self._root,
						el = Y.one('#' + node.id),
						dynLoader = root.get('dynamicLoader');
						
					node.expanded = value = !!value;
					if (dynLoader && !node.isLeaf && (!node.children  || !node.children.length)) {
						this._loadDynamic();
						return;
					}
					if (node.children && node.children.length) {
						if (value) {
							if (!node._childrenRendered) {
								self._renderChildren();
							}
							el.replaceClass(FWM.CNAME_COLLAPSED, FWM.CNAME_EXPANDED);
						} else {
							el.replaceClass(FWM.CNAME_EXPANDED, FWM.CNAME_COLLAPSED);
						}
					}
				},
				/**
				 * Triggers the dynamic loading of children for this node.
				 * @method _loadDynamic
				 * @private
				 */
				_loadDynamic: function () {
					var self = this,
						root = self._root;
					Y.one('#' + this.get('id')).replaceClass(FWM.CNAME_COLLAPSED, FWM.CNAME_LOADING);
					root.get('dynamicLoader').call(root, self, Y.bind(self._dynamicLoadReturn, self));
					
				},
				/**
				 * Callback for the dynamicLoader method.
				 * @method _dynamicLoadReturn
				 * @param response {Array} array of child nodes 
				 */
				_dynamicLoadReturn: function (response) {
					var self = this,
						node = self._node,
						root = self._root,
						initNodes = function (children) {
							YArray.each(children, function (child) {
								child._parent = node;
								child._root = root;
								child.id = child.id || Y.guid();
								initNodes(child.children || []);
							});
						};

					if (response) {
						initNodes(response);

						node.children = response;
						self._renderChildren();
					} else {
						node.isLeaf = true;
					}
					// isLeaf might have been set in the response, not just in the line above.
					Y.one('#' + node.id).replaceClass(FWM.CNAME_LOADING, (node.isLeaf?FWM.CNAME_NOCHILDREN:FWM.CNAME_EXPANDED));
				},
				/**
				 * Renders the children of this node.  
				 * It the children had been rendered, they will be replaced.
				 * @method _renderChildren
				 * @private
				 */
				_renderChildren: function () {
					var s = '',
						node = this._node,
						depth = this.get('depth');
					node._childrenRendered = true;
					this.forEachChild(function (fwNode, index, array) {
						s += fwNode._getHTML(index, array.length, depth + 1);
					});
					Y.one('#' + node.id + ' .' + FWM.CNAME_CHILDREN).setContent(s);
				},
				/**
				 * Generic setter for values stored in the underlying node.
				 * @method _genericSetter
				 * @param value {Any} Value to be set.
				 * @param name {String} Name of the attribute to be set.
				 * @protected
				 */
				_genericSetter: function (value, name) {
					if (this._state.data[name].initializing) {
						// This is to let the initial value pass through
						return value;
					}
					this._node[name] = value;
					// this is to prevent the initial value to be changed.
					return  Y.Attribute.INVALID_VALUE;
				},
				/**
				 * Generic getter for values stored in the underlying node.
				 * @method _genericGetter
				 * @param value {Any} Value stored by Attribute (not used).
				 * @param name {String} Name of the attribute to be read.
				 * @return {Any} Value read.
				 * @protected
				 */
				_genericGetter: function (value, name) {
					// since value is never actually set, 
					// value will always keep the default (initial) value.
					return this._node[name] || value;
				},
				/**
				 * Prevents this instance from being returned to the pool and reused.
				 * Remember to {{#crossLink "release"}}{{/crossLink}} this instance when no longer needed.
				 * @method hold
				 * @chainable
				 */
				hold: function () {
					return (this._node._held = this);
				},
				/**
				 * Allows this instance to be returned to the pool and reused.
				 * 
				 * __Important__: This instance should not be used after being released
				 * @method release
				 * @chainable
				 */
				release: function () {
					this._node._held = null;
					this._root._poolReturn(this);
					return this;
				},
				/**
				 * Returns the parent node for this node or null if none exists.
				 * The copy is not on {{#crossLink "hold"}}{{/crossLink}}.  
				 * Remember to release the copy to the pool when done.
				 * @method getParent
				 * @return Y.FlyweightNode
				 */
				getParent: function() {
					var node = this._node._parent;
					return (node?this._root._poolFetch(node):null);
				},
				/**
				 * Returns the next sibling node for this node or null if none exists.
				 * The copy is not on {{#crossLink "hold"}}{{/crossLink}}.  
				 * Remember to release the copy to the pool when done.
				 * @method getNextSibling
				 * @return Y.FlyweightNode
				 */
				getNextSibling: function() {
					var parent = this._node._parent,
						siblings = parent && parent.children || [],
						index = siblings.indexOf(this) + 1;
					if (index === 0 || index > siblings.length) {
						return null;
					}
					return this._root._poolFetch(siblings[index]);
				},
				/**
				 * Returns the previous sibling node for this node or null if none exists.
				 * The copy is not on {{#crossLink "hold"}}{{/crossLink}}.  
				 * Remember to release the copy to the pool when done.
				 * @method getPreviousSibling
				 * @return Y.FlyweightNode
				 */
				getPreviousSibling: function() {
					var parent = this._node._parent,
						siblings = parent && parent.children || [],
						index = siblings.indexOf(this) - 1;
					if (index < 0) {
						return null;
					}
					return this._root._poolFetch(siblings[index]);
				},
				
				/**
				 * Sugar method to toggle the expanded state of the node.
				 * @method toggle
				 * @chainable
				 */
				toggle: function() {
					this.set('expanded', !this.get('expanded'));
					return this;
				}
			},
			{
				/**
				 * Template string to be used to render this node.
				 * It should be overriden by the subclass.
				 *    
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
				 * The template should also add the `id` attribute to the DOM Element representing this node. 
				 * @property TEMPLATE
				 * @type {String}
				 * @default '<div id="{id}" class="{cname_node}"><div class="content">{label}</div><div class="{cname_children}">{children}</div></div>'
				 * @static
				 */
				TEMPLATE: '<div id="{id}" class="{cname_node}"><div class="content">{label}</div><div class="{cname_children}">{children}</div></div>',
				ATTRS: {
					/**
					 * Reference to the FlyweightManager this node belongs to
					 * @attribute root
					 * @type {Y.FlyweightManager}
					 * @readOnly
					 * 
					 */

					root: {
						readOnly: true,
						getter: function() {
							return this._root;
						}
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
						getter: '_genericGetter',
						setter: '_genericSetter'
					},
					/**
					 * Label for this node. Nodes usually have some textual content, this is the place for it.
					 * @attribute label
					 * @type {String}
					 * @default ''
					 */
					label: {
						validator: Lang.isString,
						getter: '_genericGetter',
						setter: '_genericSetter',
						value: ''
					},
					/**
					 * Id to assign to the DOM element that contains this node.  
					 * If none was supplied, it will generate one
					 * @attribute id
					 * @type {Identifier}
					 * @default Y.guid()
					 * @readOnly
					 */
					id: {
						getter: '_genericGetter',
						readOnly: true
					},
					/**
					 * Returns the depth of this node from the root.
					 * This is calculated on-the-fly.
					 * @attribute depth
					 * @type Integer
					 * @readOnly
					 */
					depth: {
						readOnly: true,
						getter: function () {
							var count = 0, 
								node = this._node;
							while (node._parent) {
								count += 1;
								node = node._parent;
							}
							return count-1;
						}
					},
					/**
					 * Expanded state of this node.
					 * @attribute expanded
					 * @type Boolean
					 * @default true
					 */
					expanded: {
						getter: '_expandedGetter',
						setter: '_expandedSetter'
					}
				}
			}
		);
	Y.FlyweightNode = FWN;

}, '@VERSION@',
{
	requires: ['base', 'base-build']
});
