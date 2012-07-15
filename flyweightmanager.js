/**
 * @module flyweightmanager
 */
YUI.add('flyweightmanager', function (Y, NAME) {
	var Lang = Y.Lang;
	
	var FWM = function (config) {
		this._pool = {
			_default: []
		}
		
	};
	
	FWM.ATTRS = {
		defaultType: {
			value: 'FlyweightNode'			
		},
		nodeTemplate: {
			value: '<div class="content">{label}</div>'
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
		}
		
	};
	
	Y.FlyweightManager = FWM;
}, '@VERSION@' ,
{
	requires: []
});
