/**
 * @module flyweightmanager
 */
YUI.add('treenode', function (Y, NAME) {
	
	var TN = Y.Base.create(
		NAME,
		Y.FlyweightNode,
		[],
		{
			
		},
		{
			TEMPLATE: '<div class="toggle"></div><div class="icon"></div><div class="selected"></div><div class="content">{label}</div>',
			ATTRS: {
				
			}
			
		}
	);
		
	Y.TreeNode = TN;


}, '@VERSION@' ,
{
	requires: ['flyweightnode','base-build']
});
