/**
 * Times plugin.
 * 
 * - filter items based on start_date and end_date properties
 * 
 * TODO:
 * 
 *
 * Created by James Cumby May 2021 by modifying tags.js
 */
Draw.loadPlugin(function(editorUi)
{
	var div = document.createElement('div');
	
	// Adds resource for action
	mxResources.parse('hiddenDates=Hidden Dates');

	// Adds action
	editorUi.actions.addAction('hiddenDates...', function()
	{
		if (editorUi.hiddenDatesWindow == null)
		{
			editorUi.hiddenDatesWindow = new hiddenDatesWindow(editorUi, document.body.offsetWidth - 380, 120, 300, 240);
			editorUi.hiddenDatesWindow.window.addListener('show', function()
			{
				editorUi.fireEvent(new mxEventObject('hiddenDates'));
			});
			editorUi.hiddenDatesWindow.window.addListener('hide', function()
			{
				editorUi.fireEvent(new mxEventObject('hiddenDates'));
			});
			editorUi.hiddenDatesWindow.window.setVisible(true);
			editorUi.fireEvent(new mxEventObject('hiddenDates'));
		}
		else
		{
			editorUi.hiddenDatesWindow.window.setVisible(!editorUi.hiddenDatesWindow.window.isVisible());
		}
	});
	
	var menu = editorUi.menus.get('extras');
	var oldFunct = menu.funct;
	
	menu.funct = function(menu, parent)
	{
		oldFunct.apply(this, arguments);
		
		editorUi.menus.addMenuItems(menu, ['-', 'filterDate'], parent);
	};

	var hiddenDatesWindow = function(editorUi, x, y, w, h)
	{
		var graph = editorUi.editor.graph;
		//var propertyName = 'tags';

		var div = document.createElement('div');
		div.style.overflow = 'hidden';
		div.style.padding = '12px 8px 12px 8px';
		div.style.height = 'auto';
		
		var startDate = document.createElement('startDate');
		startDate.setAttribute('placeholder', 'Start Date (dd/mm/yyyy)');
		startDate.setAttribute('type', 'text');
		startDate.style.width = '100%';
		startDate.style.boxSizing = 'border-box';
		startDate.style.fontSize = '12px';
		startDate.style.borderRadius = '4px';
		startDate.style.padding = '4px';
		startDate.style.marginBottom = '8px';
		div.appendChild(startDate);
		
		var endDate = document.createElement('endDate');
		endDate.setAttribute('placeholder', 'End Date (dd/mm/yyyy)');
		endDate.setAttribute('type', 'text');
		endDate.style.width = '100%';
		endDate.style.boxSizing = 'border-box';
		endDate.style.fontSize = '12px';
		endDate.style.borderRadius = '4px';
		endDate.style.padding = '4px';
		endDate.style.marginBottom = '8px';
		div.appendChild(endDate);

		//var filterInput = searchInput.cloneNode(true);
		//filterInput.setAttribute('placeholder', 'Filter tags');
		//div.appendChild(filterInput);

		//var tagCloud = document.createElement('div');
		//tagCloud.style.position = 'relative';
		//tagCloud.style.fontSize = '12px';
		//tagCloud.style.height = 'auto';
		//div.appendChild(tagCloud);

		var graph = editorUi.editor.graph;
		var lastValue = null;
		
		function convertDate(date)
		{ // Convert dd/mm/yyyy string to Date object
			parts = date.split('/');
			var dt = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
			return dt;
		};
		
		function getDatesForCell(cell)
		{
			var dates = [];
			var appl = convertDate(graph.getAttributeForCell(cell, 'application_date', ''));
			var start = convertDate(graph.getAttributeForCell(cell, 'start_date', ''));
			var end = convertDate(graph.getAttributeForCell(cell, 'end_date', ''));
			dates = [appl,start,end]
			return dates;
		};

 		function getAllDatesForCells(cells, type)
		// Get all dates for all cells of type 'start', 'end' or 'application'
		{
			var tokens = [];
			var temp = {};
			
			for (var i = 0; i < cells.length; i++)
			{
				var dates = getDatesForCell(cells[i]);

				

				if (tags.length > 0)
				{
					var t = tags.toLowerCase().split(' ');
					
					for (var j = 0; j < t.length; j++)
					{
						if (temp[t[j]] == null)
						{
							temp[t[j]] = true;
							tokens.push(t[j]);
						}
					}
				}
			}
			
			tokens.sort();
			
			return tokens;
		};
		
/* 		function getCommonTagsForCells(cells)
		{
			var commonTokens = null;
			var validTags = [];
			
			for (var i = 0; i < cells.length; i++)
			{
				var tags = getTagsForCell(cells[i]);
				validTags = [];

				if (tags.length > 0)
				{
					var tokens = tags.toLowerCase().split(' ');
					var temp = {};
					
					for (var j = 0; j < tokens.length; j++)
					{
						if (commonTokens == null || commonTokens[tokens[j]] != null)
						{
							temp[tokens[j]] = true;
							validTags.push(tokens[j]);
						}
					}
					
					commonTokens = temp;
				}
				else
				{
					return [];
				}
			}
		
			return validTags;
		}; */
/* 		
		function getLookup(tagList)
		{
			var lookup = {};
			
			for (var i = 0; i < tagList.length; i++)
			{
				lookup[tagList[i].toLowerCase()] = true;
			}
			
			return lookup;
		}; */
		
		function getAllTags()
		{
			return getAllTagsForCells(graph.model.getDescendants(
				graph.model.getRoot()));
		};

		/**
		 * Returns true if tags exist and are all in lookup.
		 */
		function matchTags(tags, lookup, tagCount)
		{
			if (tags.length > 0)
			{
				var tmp = tags.toLowerCase().split(' ');
				
				if (tmp.length > tagCount)
				{
					return false;
				}
				else
				{
					for (var i = 0; i < tmp.length; i++)
					{
						if (lookup[tmp[i]] == null)
						{
							return false;
						}
					}
					
					return true;
				}
			}
			else
			{
				return false;
			}
		};
		
		var hiddenDates = {};
		var hiddenTagCount = 0;
		var graphIsCellVisible = graph.isCellVisible;

		graph.isCellVisible = function(cell)
		{
			return graphIsCellVisible.apply(this, arguments) &&
				(hiddenTagCount == 0 ||
				!matchTags(getTagsForCell(cell), hiddenDates, hiddenTagCount));
		};
		
		// Hide cells not in date range
		function setCellsVisibleForDates(tag, visible)
		{
			var cells = graph.model.getDescendants(graph.model.getRoot());
			
			// Ignores layers for selection
			var temp = [];
			
			for (var i = 0; i < cells.length; i++)
			{
				if (graph.model.isVertex(cells[i]) || graph.model.isEdge(cells[i]))
				{
					temp.push(cells[i]);
				}
			}
			
			graph.setCellsVisible(cells, visible);
		};

/* 		function updateSelectedTags(tags, selected, selectedColor, filter)
		{
			tagCloud.innerHTML = '';
			
			var title = document.createElement('div');
			title.style.marginBottom = '8px';
			mxUtils.write(title, (filter != null) ? 'Select hidden tags:' : 'Or add/remove existing tags for cell(s):');
			tagCloud.appendChild(title);
			
			var found = 0;
			
			for (var i = 0; i < tags.length; i++)
			{
				if (filter == null || tags[i].substring(0, filter.length) == filter)
				{
					var span = document.createElement('span');
					span.style.display = 'inline-block';
					span.style.padding = '6px 8px';
					span.style.borderRadius = '6px';
					span.style.marginBottom = '8px';
					span.style.maxWidth = '80px';
					span.style.overflow = 'hidden';
					span.style.textOverflow = 'ellipsis';
					span.style.cursor = 'pointer';
					span.setAttribute('title', tags[i]);
					span.style.border = '1px solid #808080';
					mxUtils.write(span, tags[i]);
					
					if (selected[tags[i]])
					{
						span.style.background = selectedColor;
						span.style.color = '#ffffff';
					}
					else
					{
						span.style.background = (uiTheme == 'dark') ? 'transparent' : '#ffffff';
					}
					
					mxEvent.addListener(span, 'click', (function(tag)
					{
						return function()
						{
							if (!selected[tag])
							{
								if (!graph.isSelectionEmpty())
								{
									addTagsToCells(graph.getSelectionCells(), [tag])
								}
								else
								{
									hiddenDates[tag] = true;
									hiddenTagCount++;
									refreshUi();
									
									window.setTimeout(function()
									{
										graph.refresh();
									}, 0);
								}
							}
							else
							{
								if (!graph.isSelectionEmpty())
								{
									removeTagsFromCells(graph.getSelectionCells(), [tag])
								}
								else
								{
									delete hiddenDates[tag];
									hiddenTagCount--;
									refreshUi();
									
									window.setTimeout(function()
									{
										graph.refresh();
									}, 0);
								}
							}
						};
					})(tags[i]));
					
					tagCloud.appendChild(span);
					mxUtils.write(tagCloud, ' ');
					found++;
				}
			}

			if (found == 0)
			{
				mxUtils.write(tagCloud, 'No tags found');
			}
		}; */
		
/* 		function updateTagCloud(tags)
		{
			updateSelectedTags(tags, hiddenDates, '#bb0000', filterInput.value);
		}; */
		
		function refreshUi()
		{
			if (graph.isSelectionEmpty())
			{
				updateTagCloud(getAllTags(), hiddenDates);
				searchInput.style.display = 'none';
				filterInput.style.display = '';
			}
			else
			{
				updateSelectedTags(getAllTags(), getLookup(getCommonTagsForCells(graph.getSelectionCells())), '#2873e1');
				searchInput.style.display = '';
				filterInput.style.display = 'none';
			}
		}
		
		refreshUi();
		
/* 		function addTagsToCells(cells, tagList)
		{
			if (cells.length > 0 && tagList.length > 0)
			{
				graph.model.beginUpdate();
				
				try
				{
					for (var i = 0; i < cells.length; i++)
					{
						var temp = getTagsForCell(cells[i]);
						var tags = temp.toLowerCase().split(' ');
						
						for (var j = 0; j < tagList.length; j++)
						{
							var tag = tagList[j];
							var changed = false;
		
							if (tags.length == 0 || mxUtils.indexOf(tags, tag) < 0)
							{
								temp = (temp.length > 0) ? temp + ' ' + tag : tag;
								changed = true;
							}
						}
						
						if (changed)
						{
							graph.setAttributeForCell(cells[i], 'tags', temp);
						}
					}
				}
				finally
				{
					graph.model.endUpdate();
				}
			}
		}; */

/* 		function removeTagsFromCells(cells, tagList)
		{
			if (cells.length > 0 && tagList.length > 0)
			{
				graph.model.beginUpdate();
				
				try
				{
					for (var i = 0; i < cells.length; i++)
					{
						var tags = getTagsForCell(cells[i]);
						
						if (tags.length > 0)
						{
							var tokens = tags.split(' ');
							var changed = false;
							
							for (var j = 0; j < tagList.length; j++)
							{
								var idx = mxUtils.indexOf(tokens, tagList[j]);
								
								if (idx >= 0)
								{
									tokens.splice(idx, 1);
									changed = true;
								}
							}

							if (changed)
							{
								graph.setAttributeForCell(cells[i], 'tags', tokens.join(' '));
							}
						}
					}
				}
				finally
				{
					graph.model.endUpdate();
				}
			}
		}; */
		
		graph.selectionModel.addListener(mxEvent.EVENT_CHANGE, function(sender, evt)
		{
			refreshUi();
		});
		
		graph.model.addListener(mxEvent.EVENT_CHANGE, function(sender, evt)
		{
			refreshUi();
		});

		mxEvent.addListener(startDate, 'keyup', function()
		{
			updateTagCloud(getAllTags());
		});
		
		mxEvent.addListener(endDate, 'keyup', function(evt)
		{
			// Ctrl or Cmd keys
			if (evt.keyCode == 13)
			{
				addTagsToCells(graph.getSelectionCells(), searchInput.value.toLowerCase().split(' '));
				searchInput.value = '';
			}
		});

		this.window = new mxWindow(mxResources.get('hiddenDates'), div, x, y, w, null, true, true);
		this.window.destroyOnClose = false;
		this.window.setMaximizable(false);
		this.window.setResizable(true);
		this.window.setScrollable(true);
		this.window.setClosable(true);
		this.window.contentWrapper.style.overflowY = 'scroll';
		
		this.window.addListener('show', mxUtils.bind(this, function()
		{
			this.window.fit();
			
			if (this.window.isVisible())
			{
				searchInput.focus();
				
				if (mxClient.IS_GC || mxClient.IS_FF || document.documentMode >= 5)
				{
					searchInput.select();
				}
				else
				{
					document.execCommand('selectAll', false, null);
				}
			}
			else
			{
				graph.container.focus();
			}
		}));
		
		this.window.setLocation = function(x, y)
		{
			var iw = window.innerWidth || document.body.clientWidth || document.documentElement.clientWidth;
			var ih = window.innerHeight || document.body.clientHeight || document.documentElement.clientHeight;
			
			x = Math.max(0, Math.min(x, iw - this.table.clientWidth));
			y = Math.max(0, Math.min(y, ih - this.table.clientHeight - 48));

			if (this.getX() != x || this.getY() != y)
			{
				mxWindow.prototype.setLocation.apply(this, arguments);
			}
		};
		
		var resizeListener = mxUtils.bind(this, function()
		{
			var x = this.window.getX();
			var y = this.window.getY();
			
			this.window.setLocation(x, y);
		});
		
		mxEvent.addListener(window, 'resize', resizeListener);

		this.destroy = function()
		{
			mxEvent.removeListener(window, 'resize', resizeListener);
			this.window.destroy();
		}
	};

});
