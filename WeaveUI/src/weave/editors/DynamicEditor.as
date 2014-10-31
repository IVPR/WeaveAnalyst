/*
	Weave (Web-based Analysis and Visualization Environment)
	Copyright (C) 2008-2011 University of Massachusetts Lowell
	
	This file is a part of Weave.
	
	Weave is free software: you can redistribute it and/or modify
	it under the terms of the GNU General Public License, Version 3,
	as published by the Free Software Foundation.
	
	Weave is distributed in the hope that it will be useful,
	but WITHOUT ANY WARRANTY; without even the implied warranty of
	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
	GNU General Public License for more details.
	
	You should have received a copy of the GNU General Public License
	along with Weave.  If not, see <http://www.gnu.org/licenses/>.
*/

package weave.editors
{
	import flash.display.DisplayObject;
	import flash.events.Event;
	import flash.events.MouseEvent;
	import flash.utils.Dictionary;
	
	import mx.containers.VBox;
	import mx.controls.Button;
	import mx.core.IUIComponent;
	import mx.events.FlexEvent;
	import mx.utils.ObjectUtil;
	
	import weave.api.core.ILinkableDynamicObject;
	import weave.api.core.ILinkableHashMap;
	import weave.api.core.ILinkableObject;
	import weave.api.core.ILinkableVariable;
	import weave.api.data.IAttributeColumn;
	import weave.api.linkBindableProperty;
	import weave.api.ui.ISelectableAttributes;
	import weave.compiler.StandardLib;
	import weave.core.LinkableBoolean;
	import weave.core.LinkableNumber;
	import weave.core.SessionManager;
	import weave.core.UIUtils;
	import weave.primitives.WeaveTreeItem;
	import weave.ui.CodeEditor;
	import weave.ui.ColumnListComponent;
	import weave.ui.CustomCheckBox;
	import weave.ui.CustomVRule;
	import weave.ui.DynamicColumnComponent;
	import weave.ui.ExpandButton;
	import weave.ui.Indent;
	import weave.ui.IndentTextInput;
	import weave.ui.SessionStateEditor;
	import weave.utils.VectorUtils;
	
	public class DynamicEditor
	{
		/**
		 * Creates an editor component for an ILinkableObject.
		 * @param obj Either an ILinkableObject or a session state tree generated by SessionManager.getSessionStateTree().
		 * @param label A label for the ILinkableObject.
		 * @param indentChildren If true and the object does not have a simple editor, an Indent component will be created with
		 *                       the specified label in front of a vertical list of child editors. If false, the vertical list
		 *                       will not be indented.
		 */
		public static function createComponent(object:Object, label:String, indentChildren:Boolean):IUIComponent
		{
			var sm:SessionManager = WeaveAPI.SessionManager as SessionManager;
			
			var tree:WeaveTreeItem = object as WeaveTreeItem;
			var target:ILinkableObject = object as ILinkableObject;
			if (target)
				tree = sm.getSessionStateTree(target, label);
			else
				target = tree.source as ILinkableObject;
			
			var indent:Indent;
			
			var lb:LinkableBoolean = target as LinkableBoolean;
			if (lb)
			{
				var checkBox:CustomCheckBox = new CustomCheckBox();
				checkBox.label = lang(label);
				linkBindableProperty(lb, checkBox, 'selected');
				return checkBox;
			}
			
			var ln:LinkableNumber = target as LinkableNumber;
			if (ln)
			{
				var input:IndentTextInput = new IndentTextInput();
				input.translate = true;
				input.label = label;
				linkBindableProperty(ln, input, 'text', 250, true);
				return input;
			}
			
			var lv:ILinkableVariable = target as ILinkableVariable;
			if (lv)
			{
				var codeEditor:CodeEditor = new CodeEditor();
				codeEditor.addEventListener(FlexEvent.CREATION_COMPLETE, function(event:Event):void {
					linkBindableProperty(lv, event.target, 'text', 500, true)
					
					var eb:ExpandButton = ExpandButton.makeExpandable(codeEditor, false, 24);
					eb.addEventListener(MouseEvent.CLICK, function(e:Event):void {
						indent.setStyle('verticalAlign', eb.expanded ? 'top' : 'middle');
					});
					
					function onchange(event:Event = null):void {
						if (codeEditor.text.indexOf('\r') >= 0 || codeEditor.text.indexOf('\n') >= 0)
							eb.expanded = true;
					}
					codeEditor.addEventListener(Event.CHANGE, onchange);
					onchange();
				});
				
				indent = new Indent();
				indent.translate = true;
				indent.label = label;
				indent.setStyle('verticalAlign', 'top');
				indent.addChild(codeEditor);
				
				return indent;
			}
			
			var column:IAttributeColumn = target as IAttributeColumn;
			var ldo:ILinkableDynamicObject = target as ILinkableDynamicObject;
			if (column && ldo)
			{
				var dcc:DynamicColumnComponent = new DynamicColumnComponent();
				dcc.label = label;
				dcc.dynamicObject = ldo;
				return dcc;
			}
			
			var lhm:ILinkableHashMap = target as ILinkableHashMap;
			if (lhm && lhm.typeRestriction == IAttributeColumn)
			{
				var clc:ColumnListComponent = new ColumnListComponent();
				clc.label = label;
				clc.hashMap = lhm;
				clc.listHeight = 160;
				return clc;
			}
			
			if (ldo || lhm)
			{
				var button:Button = new Button();
				button.data = target;
				button.label = lang("Edit session state");
				button.addEventListener(MouseEvent.CLICK, function(event:Event):void {
					SessionStateEditor.openDefaultEditor(event.target.data as ILinkableObject);
				});
				
				indent = new Indent();
				indent.label = label;
				indent.addChild(button);
				
				return indent;
			}
			
			//----------------------
			
			// for everything else, generate editors for each child in the session state
			var subtrees:Array = tree.children;
			
			if (!(target is ILinkableHashMap))
			{
				// sort by class, then by name
				StandardLib.sort(subtrees, function(st1:WeaveTreeItem, st2:WeaveTreeItem):int {
					var c1:Class = Object(st1.source).constructor;
					var c2:Class = Object(st2.source).constructor;
					var l1:String = st1.label;
					var l2:String = st2.label;
					return ObjectUtil.stringCompare(String(c1), String(c2))
						|| ObjectUtil.stringCompare(l1, l2);
				});
			}
			
			// editors for enumerated selectable attributes should appear first
			var owsa:ISelectableAttributes = target as ISelectableAttributes;
			if (owsa)
			{
				var lookup:Dictionary = VectorUtils.createLookup(subtrees, 'source');
				var names:Array = owsa.getSelectableAttributeNames();
				subtrees = owsa.getSelectableAttributes()
					.map(function(attr:*, i:*, a:*):WeaveTreeItem{
						return subtrees[lookup[attr]]
							|| sm.getSessionStateTree(attr, names[i]);
					})
					.concat(subtrees);
			}
			
			// create child editors
			var components:Array = [];
			var ignore:Dictionary = new Dictionary(true);
			for each (var subtree:WeaveTreeItem in subtrees)
			{
				var childLabel:String = subtree.label;
				var childObject:ILinkableObject = subtree.source;
				
				// make sure we don't add duplicate editors
				if (ignore[childObject])
					continue;
				ignore[childObject] = true;
				
				var component:IUIComponent = createComponent(childObject, childLabel, true);
				if (component)
					components.push(component);
			}
			
			// if there are no child components, there is no session state and no editor.
			if (components.length == 0)
				return null;
			
			// create a vbox to contain the child editors
			var vbox:VBox = new VBox();
			vbox.label = lang(label);
			vbox.setStyle('verticalGap', 4);
			UIUtils.pad(vbox, 4, 100, 100);
			for each (component in components)
				vbox.addChild(component as DisplayObject);
			
			if (!indentChildren)
				return vbox;
			
			// indent the child editors
			indent = new Indent();
			indent.translate = true;
			indent.label = label;
			indent.setStyle('verticalAlign', 'top');
			indent.addChild(new CustomVRule());
			indent.addChild(vbox);
			return indent;
		}
	}
}

import flash.display.DisplayObject;

import mx.binding.utils.BindingUtils;

import weave.api.core.ILinkableVariable;
import weave.api.getCallbackCollection;
import weave.core.ClassUtils;
import weave.core.UIUtils;
import weave.utils.EventUtils;

internal class JsonSynchronizer
{
	public static function available():Boolean
	{
		return ClassUtils.getClassDefinition('JSON') != null;
	}
	
	public function JsonSynchronizer(linkableVariable:ILinkableVariable, host:DisplayObject, prop:String)
	{
		this.lv = linkableVariable;
		this.host = host;
		this.prop = prop;
		
		getCallbackCollection(lv).addImmediateCallback(host, handleObject, true);
		BindingUtils.bindSetter(EventUtils.generateDelayedCallback(linkableVariable, handleJson, 500, true), this.host, this.prop);
	}
	
	public var JSON:Object = ClassUtils.getClassDefinition('JSON');
	public var lv:ILinkableVariable;
	public var host:Object;
	public var prop:String;
	
	private function handleObject():void
	{
		host[prop] = JSON.stringify(lv.getSessionState());
	}
	
	private function handleJson(value:* = null):void
	{
		lv.setSessionState(JSON.parse(value));
	}
}
