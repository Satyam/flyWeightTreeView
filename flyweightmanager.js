/*jslint nomen: true, white: true, browser: true, maxerr: 100 */
/*global YUI */
/**
 * @module flyweightmanager
 */
YUI.add('flyweightmanager', function (Y, NAME) {
	var Lang = Y.Lang;
	
	var FWM = function (config) {
		this._pool = {
			_default: []
		},
		this.on('click', this._onClick, this);
		this.after('click', this._afterClick, this);
		this.publish('click', {
			preventedFn: this._clickDropped,
			stoppedFn: this._clickDropped
		});
		
	};
	
	FWM.ATTRS = {
		defaultType: {
			value: 'FlyweightNode'			
		},
		nodeTemplate: {
			value: '<div id="{id}" class="node"><div class="content">{label}</div><div class="children">{children}</div></div>'
		}
	};
	

	FWM.prototype = {
		_root: null,
		_pool: null,
		_loadConfig: function (config) {
			this._root = {
				children: Y.clone(config)
			};
		},
		_poolFetch: function(node) {
			var pool = this._pool[node.type || '_default'],
				fwNode;
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
		_poolReturn: function (fwNode) {
			var pool = this._pool[fwNode._node.type || '_default'];
			if (pool) {
				pool.push(fwNode);
			}
			
		},
		_getNode: function (node) {
			var newNode,
				Type = node.type || this.get('defaultType');
			if (Lang.isString(Type)) {
				Type = Y[Type];
			}
			if (Type) {
				newNode = new Type()
				if (newNode instanceof Y.FlyweightNode) {
					newNode._set('root', this);
					newNode._slideTo(node);
					return newNode;
				}
			}
			return null;
		},
		_getRootNode: function () {
			return this._getNode(this._root);
		},
		_getHTML: function () {
			var s = '',
				root = this._getRootNode();
			root.forEachChild( function (fwNode) {
				s += fwNode._getHTML();
			});
			this._poolReturn(root);
			return s;
		},
		_onClick: function (ev) {
			var id = ev.domEvent.target.ancestor('.node', true).get('id'),
				found = null,
				scan = function (node) {
					if (node.id === id) {
						found = node;
						return true;
					} else if (node.children) {
						return Y.Array.some(node.children, scan);
					}
					return false;
				};
			if (scan(this._root)) {
				ev.node = this._poolFetch(found);
			}
			
		},
		_afterClick: function (ev) {
			if (ev.node) {
				this._poolReturn(ev.node);
			}
		},
		_clickDropped: function (ev) {
			if (ev._getFacade().node) {
				this._poolReturn(ev._getFacade().node);
			}
		}
		
	};
	
	Y.FlyweightManager = FWM;
}, '@VERSION@' ,
{
	requires: []
});
