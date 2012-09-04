/*jslint nomen: true, white: true, browser: true, maxerr: 100 */
/*global YUI */
/**
 * @module flyweight
 * @submodule flyweightmanager
 *
 */
YUI.add('flyweightmanager', function (Y, NAME) {
	'use strict';
	var Lang = Y.Lang,
		DOT = '.',
		getCName = Y.ClassNameManager.getClassName,
		cName = function (name) {
			return getCName(NAME, name);
		},
		CNAME_NODE = cName('node'),
		CNAME_CHILDREN = cName('children'),
		CNAME_COLLAPSED = cName('collapsed'),
		CNAME_EXPANDED = cName('expanded'),
		CNAME_NOCHILDREN = cName('no-children'),
		CNAME_FIRSTCHILD = cName('first-child'),
		CNAME_LASTCHILD = cName('last-child'),
	
	/**
	 * Extension to handle its child nodes by using the flyweight pattern.
	 * @class FlyweightManager
	 * @constructor
	 */
		FWM = function () {
			this._pool = {
				_default: []
			};
		};
	
	FWM.ATTRS = {
		/**
		 * Default object type of the child nodes if no explicit type is given in the configuration tree.
		 * It can be specified as an object reference, these two are equivalent: `Y.TreeNode` or  `'TreeNode'`.  
		 * 
		 * @attribute defaultType
		 * @type {String | Object}
		 * @default 'FlyweightNode'
		 */
		defaultType: {
			value: 'FlyweightNode'			
		}
	};

	/**
	 * Constant to use as the class name for the DOM element representing the node.
	 * @property CNAME\_NODE
	 * @type String
	 * @static
	 */
	FWM.CNAME_NODE = CNAME_NODE;
	/**
	 * Constant to use as the class name for the DOM element that will containe the children of this node.
	 * @property CNAME\_CHILDREN
	 * @type String
	 * @static
	 */
	FWM.CNAME_CHILDREN = CNAME_CHILDREN;
	/**
	 * Constant added to the DOM element for this node when its state is not expanded.
	 * @property CNAME\_COLLAPSED
	 * @type String
	 * @static
	 */
	FWM.CNAME_COLLAPSED = CNAME_COLLAPSED;
	/**
	 * Constant added to the DOM element for this node when its state is expanded.
	 * @property CNAME\_EXPANDED
	 * @type String
	 * @static
	 */
	FWM.CNAME_EXPANDED = CNAME_EXPANDED;
	/**
	 * Constant added to the DOM element for this node when it has no children.
	 * @property CNAME\_NOCHILDREN
	 * @type String
	 * @static
	 */
	FWM.CNAME_NOCHILDREN = CNAME_NOCHILDREN;
	/**
	 * Constant added to the DOM element for this node when it is the first in the group.
	 * @property CNAME\_FIRSTCHILD
	 * @type String
	 * @static
	 */
	FWM.CNAME_FIRSTCHILD = CNAME_FIRSTCHILD;
	/**
	 * Constant added to the DOM element for this node when it is the last in the group.
	 * @property CNAME\_LASTCHILD
	 * @type String
	 * @static
	 */
	FWM.CNAME_LASTCHILD = CNAME_LASTCHILD;

	FWM.prototype = {
		/**
		 * Clone of the configuration tree.
		 * The FlyweightNode instances will use the nodes in this tree as the storage for their state.
		 * @property _tree
		 * @type Object
		 * @private
		 */
		_tree: null,
		/**
		 * Pool of FlyweightNode instances to use and reuse by the manager.  
		 * It contains a hash of arrays indexed by the node type. 
		 * Each array contains a series of FlyweightNode subclasses of the corresponding type.
		 * @property _pool
		 * @type {Object}
		 * @private
		 */
		_pool: null,
		/**
		 * Method to load the configuration tree.
		 * This is not done in the constructor so as to allow the subclass 
		 * to process the tree definition anyway it wants, adding defaults and such
		 * and to name the tree whatever is suitable.
		 * For TreeView, the configuration property is named `tree`, for a form, it is named `form`.
		 * It also sets initial values for some default properties such as `parent` references and `id` for all nodes.
		 * @method _loadConfig
		 * @param tree {Object} configuration tree
		 * @protected
		 */
		_loadConfig: function (tree) {
			this._tree = {
				children: Y.clone(tree)
			};
			var initNodes = function (parent) {
				Y.Array.each(parent.children, function (child) {
					child._parent = parent;
					child.id = child.id || Y.guid();
					initNodes(child);
				});
			};
			initNodes(this._tree);
		},
		/**
		 * Pulls from the pool an instance of the type declared in the given node
		 * and slides it over that node.
		 * If there are no instances of the given type in the pool, a new one will be created via {{#crossLink "_getNode"}}{{/crossLink}}
		 * If an instance is held (see: {{#crossLink "Y.FlyweightNode/hold"}}{{/crossLink}}), it will be returned instead.
		 * @method _poolFetch
		 * @param node {Object} reference to a node within the configuration tree
		 * @return {Y.FlyweightNode} Usually a subclass of FlyweightNode positioned over the given node
		 * @protected
		 */
		_poolFetch: function(node) {
			var pool,
				fwNode = node._held;
				
			if (fwNode) {
				return fwNode;
			}
			if (node.type) {
				pool = this._pool[node.type];
				if (!pool) {
					pool = this._pool[node.type] = [];
				}
			} else {
				pool = this._pool._default;
			}
			if (pool.length) {
				fwNode = pool.pop();
				fwNode._slideTo(node);
				return fwNode;
			}
			return this._getNode(node);
		},
		/**
		 * Returns the FlyweightNode instance to the pool.
		 * Instances held (see: {{#crossLink "Y.FlyweightNode/hold"}}{{/crossLink}}) are never returned.
		 * @method _poolReturn
		 * @param fwNode {Y.FlyweightNode} Instance to return.
		 * @protected
		 */
		_poolReturn: function (fwNode) {
			if (fwNode._node._held) {
				return;
			}
			var pool = this._pool[fwNode._node.type || '_default'];
			if (pool) {
				pool.push(fwNode);
			}
			
		},
		/**
		 * Returns a new instance of the type given in node or the 
		 * {{#crossLink "defaultType"}}{{/crossLink}} if none specified
		 * and slides it on top of the node provided.
		 * @method _getNode
		 * @param node {Object} reference to a node within the configuration tree
		 * @return {Y.FlyweightNode} Instance of the corresponding subclass of FlyweightNode
		 * @protected
		 */
		_getNode: function (node) {
			var newNode,
				Type = node.type || this.get('defaultType');
			if (Lang.isString(Type)) {
				Type = Y[Type];
			}
			if (Type) {
				newNode = new Type();
				if (newNode instanceof Y.FlyweightNode) {
					newNode._set('root', this);
					newNode._slideTo(node);
					return newNode;
				}
			}
			return null;
		},
		/**
		 * Returns an instance of Flyweight node positioned over the root
		 * @method _getRootNode
		 * @return {Y.FlyweightNode} 
		 * @protected
		 */
		_getRootNode: function () {
			return this._poolFetch(this._tree);
		},
		/**
		 * Returns a string with the markup for the whole tree. 
		 * A subclass might opt to produce markup for those parts visible. (lazy rendering)
		 * @method _getHTML
		 * @return {String} HTML for this widget
		 * @protected
		 */
		_getHTML: function () {
			var s = '',
				root = this._getRootNode();
			root.forEachChild( function (fwNode, index, array) {
				s += fwNode._getHTML(index, array.length, 0);
			});
			this._poolReturn(root);
			return s;
		},
		/**
		 * Locates a node in the tree by the element that represents it.
		 * @method _findNodeByElement
		 * @param el {Y.Node} Any element belonging to the tree
		 * @return {Object} Node that produced the markup for that element or null if not found
		 * @protected
		 */
		_findNodeByElement: function(el) {
			var id = el.ancestor(DOT + CNAME_NODE, true).get('id'),
				found = null,
				scan = function (node) {
					if (node.id === id) {
						found = node;
						return true;
					}
					if (node.children) {
						return Y.Array.some(node.children, scan);
					}
					return false;
				};
			if (scan(this._tree)) {
				return found;
			}
			return null;
		},
		/**
		 * Returns a FlyweightNode instance from the pool, positioned over the node whose markup generated some event.
		 * @method _poolFetchFromEvent
		 * @param ev {EventFacade}
		 * @return {Y.FlyweightNode} The FlyweightNode instance or null if not found.
		 * @private
		 */
		_poolFetchFromEvent: function (ev) {
			var found = this._findNodeByElement(ev.domEvent.target);
			if (found) {
				return this._poolFetch(found);
			}
			return null;			
		},
		/**
		 * Traverses the whole configuration tree, calling a given function for each node.
		 * If the function returns true, the traversing will terminate.
		 * @method _forSomeCfgNode
		 * @param fn {Function} Function to call on each configuration node
		 *		@param fn.cfgNode {Object} node in the configuratino tree
		 *		@param fn.depth {Integer} depth of this node within the tee
		 *		@param fn.index {Integer} index of this node within the array of its siblings
		 * @param scope {Object} scope to run the function in, defaults to this.
		 * @return true if any of the function calls returned true (the traversal was terminated earlier)
		 * @protected
		 */
		_forSomeCfgNode: function(fn, scope) {
			scope = scope || this;
			var loop = function(cfgNode, depth) {
				return Y.Array.some(cfgNode.children || [], function(childNode, index) {
					fn.call(scope, childNode,depth, index);
					return loop(childNode,depth + 1);
				});
			};
			return loop(this._tree, 0);
		}
	};
	
	Y.FlyweightManager = FWM;
}, '@VERSION@',
{
	requires: ['classnamemanager']
});
