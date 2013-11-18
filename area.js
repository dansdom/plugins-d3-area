// extend code
// https://github.com/dansdom/extend
var Extend = Extend || function(){var h,g,b,e,i,c=arguments[0]||{},f=1,k=arguments.length,j=!1,d={hasOwn:Object.prototype.hasOwnProperty,class2type:{},type:function(a){return null==a?String(a):d.class2type[Object.prototype.toString.call(a)]||"object"},isPlainObject:function(a){if(!a||"object"!==d.type(a)||a.nodeType||d.isWindow(a))return!1;try{if(a.constructor&&!d.hasOwn.call(a,"constructor")&&!d.hasOwn.call(a.constructor.prototype,"isPrototypeOf"))return!1}catch(c){return!1}for(var b in a);return void 0===b||d.hasOwn.call(a, b)},isArray:Array.isArray||function(a){return"array"===d.type(a)},isFunction:function(a){return"function"===d.type(a)},isWindow:function(a){return null!=a&&a==a.window}};"boolean"===typeof c&&(j=c,c=arguments[1]||{},f=2);"object"!==typeof c&&!d.isFunction(c)&&(c={});k===f&&(c=this,--f);for(;f<k;f++)if(null!=(h=arguments[f]))for(g in h)b=c[g],e=h[g],c!==e&&(j&&e&&(d.isPlainObject(e)||(i=d.isArray(e)))?(i?(i=!1,b=b&&d.isArray(b)?b:[]):b=b&&d.isPlainObject(b)?b:{},c[g]=Extend(j,b,e)):void 0!==e&&(c[g]= e));return c};

// D3 Area Plugin
(function (d3) {
    // this ones for you 'uncle' Doug!
    'use strict';
    
    // Plugin namespace definition
    d3.Area = function (options, element, callback) {
        this.el = element;
        this.callback = callback;
        // this is the namespace for all bound event handlers in the plugin
        this.namespace = "area";
        // extend the settings object with the options, make a 'deep' copy of the object using an empty 'holding' object
        // using the extend code that I ripped out of jQuery
        this.opts = Extend(true, {}, d3.Area.settings, options);
        this.init();
    };
    
    // these are the plugin default settings that will be over-written by user settings
    d3.Area.settings = {
        'height': '730',
        'width': '460',
        'speed' : 2000,  // transition speed
        'margin': {top: 30, right: 10, bottom: 80, left: 80},
        'data' : null,  // I'll need to figure out how I want to present data options to the user
        'dataUrl' : null,  // this is a url for a resource
        'dataType' : 'json',
        'dateFormat' : '%d-%b-%y',  // if a date scale is being used then this is the option to format it
        'colorRange' : [], // instead of defining a color array, I will set a color scale and then let the user overwrite it
        'interpolate' : null, // define an interpolation for the lines and areas
        // maybe only if there is one data set???
        'elements' : {
            'line' : 'black',  // the line on the graph - set to null if no line is wanted
            'lineOpacity' : 1,  // opacity of the line object
            'area' : '#ccc',  // show area
            'areaOpacity' : 1,  // opacity of the area element
            'dot' : '#fdd0a2', // the dots on the line (I may make this a customisable shape though) - set to null if no dot is wanted
            'dotRadius' : 3.5,  // 0 will show no dots
            'square' : null,  // show squares at the data points
            'squareSize' : 7,  // the size of the squares on the data points
            'xAxis' : {
                'visible' : true,
                'tickSize' : 5,
                'label' : true,
                'labelOffsetX' : 0,
                'labelOffsetY' : 40,
                'labelRotate' : 0,
                'rangeMin' : null, // can set a value for the minimum range on the x-axis
                'rangeMax' : null  // can set a value for the maximum range on the x-axis
            },
            'yAxis' : {
                'visible' : true,
                'tickSize' : 5,
                'label' : true,
                'labelOffsetX' : -40,
                'labelOffsetY' : 0,
                'labelRotate' : -90,
                'rangeMin' : null, // can set a value for the minimum range on the y-axis
                'rangeMax' : null  // can set a value for the maximum range on the y-axis
            }
        },
        'dataStructure' : {
            'x' : 'x1',  // this value may end up being an array so I can support multiple data sets
            'y' : 'y1',
            'key' : 'key',
            'ticksX' : 10,  // tha amount of ticks on the x-axis
            'ticksY' : 10  // the amount of ticks on the y-axis
        },
        'scale' : {
            'x' : 'linear',
            'y' : 'linear'
        },
        'chartName' : false  // If there is a chart name then insert the value. This allows for deep exploration to show category name
    };
    
    // plugin functions go here
    d3.Area.prototype = {
        init : function() {
            var container = this;

            // build the chart with the data
            this.getData();
        },
        updateChart : function() {
            var container = this;

            // if there is a colour range defined for this chart then use the settings. If not, use the inbuild category20 colour range
            if (this.opts.colorRange.length > 0) {
                container.color = d3.scale.ordinal().range(this.opts.colorRange);
            }
            else {
                container.color = d3.scale.category20();
            }

            container.margin = this.opts.margin,
            container.width = this.opts.width - container.margin.left - container.margin.right;
            container.height = this.opts.height - container.margin.top - container.margin.bottom; 

            // define the scale and axis' for the graph
            this.setScale();
            this.setAxis();

            // create the svg element that holds the chart
            this.setLayout();
            // define the line of the chart
            container.line = this.getLine();
            // define the area that sits under the line
            container.area = this.getArea();
            // add the x and y axis to the chart
            this.addAxis();
            // add the elements to the chart
            this.addElements();
            
            // run the callback after the plugin has finished initialising
            if (typeof container.callback === "function") {
                container.callback.call(this, container);
            }
        },
        setLayout : function() {
            var container = this;

            // define the svg element
            if (!container.svg) {
                container.svg = d3.select(container.el).append("svg")      
            }
            container.svg
                .datum(container.data)
                .attr("width", container.width + container.margin.left + container.margin.right)
                .attr("height", container.height + container.margin.top + container.margin.bottom);

            // define the chart element
            if (!container.chart) {
                container.chart = container.svg.append("g");
                    
            }
            container.chart
                .attr("class", "chart")
                .attr("transform", "translate(" + container.margin.left + "," + container.margin.top + ")");
        },
        setTitle : function() {
            var container = this;

            if (container.opts.chartName) {
                if (!container.chartName) {
                    container.chartName = container.chart.append("g")
                        .attr("class", "chartName")
                        .append("text");
                        //console.log('adding chart name');
                }
                container.chartName = container.chart.select(".chartName").select("text")
                    .text(container.opts.chartName);
            }
        },
        addAxis : function() {
            var container = this,
                elementOpts = container.opts.elements;

            // if we are building an x-axis
            if (elementOpts.xAxis.visible) {
                // look to see if it is already defined
                if (!container.X) {
                    container.X = container.chart.append("g");   
                }
                // style the x-axis
                container.X
                    .attr("class", "x-axis")
                    .attr("transform", "translate(0," + container.height + ")")
                    .style("shape-rendering", "crispEdges")
                    .call(container.xAxis);
                // add the labels
                container.addXLabels();
            }
            // else if the x-axis exists then remove it
            else if (container.X) {
                container.X.remove();
                // I have to set this to undefined so that I can test for it again
                container.X = undefined;
                containerXLabel = undefined;
            }

            // if we are building a y-axis
            if (elementOpts.yAxis.visible) {
                // look to see if it is already defined
                if (!container.Y) {
                    container.Y = container.chart.append("g");
                }
                container.Y
                    .attr("class", "y-axis")
                    .style("shape-rendering", "crispEdges")
                    .call(container.yAxis);
                // add the labels
                container.addYLabels();
            }
            // else if the -axis exists then remove it
            else if (container.Y) {
                container.Y.remove();
                container.Y = undefined;
                container.YLabel = undefined;
            }
        },
        addXLabels : function() {
            var container = this,
                xOpts = container.opts.elements.xAxis;

            if (xOpts.label) {
                if (!container.XLabel) {
                    container.XLabel = container.X.append("text");
                }
                // add the settings to the label
                container.XLabel
                    .attr("dx", function() {
                        var chartLength = container.width,
                            labelPosition = (chartLength/2) + xOpts.labelOffsetX;
                        return labelPosition;
                    })
                    .attr("dy", xOpts.labelOffsetY)
                    .style("shape-rendering", "crispEdges")
                    .attr("transform", "rotate(" + xOpts.labelRotate + ")")
                    .text(container.opts.dataStructure.x);
            }
            // else remove the label
            else {
                if (container.XLabel) {
                    container.XLabel.remove();
                    container.XLabel = undefined;
                }
            }
        },
        addYLabels : function() {
            var container = this,
                yOpts = container.opts.elements.yAxis;

            if (yOpts.label) {
                if (!container.YLabel) {
                    container.YLabel = container.Y.append("text");
                }
                container.YLabel
                    .attr("dy", yOpts.labelOffsetX)
                    // note, this is tricky because of the rotation it is actually the "dx" value that gives the vertical positon and not the "dy" value
                    .attr("dx", function() {
                        var chartHeight = container.height,
                            labelPosition = (chartHeight/2) + yOpts.labelOffsetY;
                        return -labelPosition;
                    })
                    .style("shape-rendering", "crispEdges")
                    .attr("transform", "rotate(" + yOpts.labelRotate + ")")
                    .text(container.opts.dataStructure.y);
            }
            // else remove the label
            else {
                if (container.YLabel) {
                    container.YLabel.remove();
                    container.YLabel = undefined;
                }
            }
        },
        addElements : function() {
            var container = this,
                elements = container.opts.elements,
                dataStructure = container.opts.dataStructure,
                currentGroups,
                newGroups,
                oldGroups;

            container.groups = container.chart.selectAll(".data-group")
                .data(container.dataLayers);
            //console.log(container.dataLayers);

            currentGroups = container.chart.select(".data-group");
            container.updateCurrentGroups(currentGroups);
            
            // add the new data
            newGroups = container.groups.enter()
                .append("g")
                .attr("class", function(d) { return "data-group " + d.key; });
            container.addNewGroups(newGroups);

            // remove the old data
            oldGroups = container.groups.exit()
                .remove();
        },
        // updates the current groups on the chart
        updateCurrentGroups : function(groups) {
            var container = this,
                currentGroup;

            //console.log(groups.length);
            groups.each(function(d, i) {
                currentGroup = d3.select(this);
                // move the current layers state onto the group
                currentGroup.datum(container.dataLayers[i]);
                //console.log('updating each current group');
                //console.log(d);
                
                // make the transitions for each of the current groups
                currentGroup.select(".line")
                    .attr("d", function(d) { return container.line(d.values) })
                    .style("stroke", container.opts.colorRange[i]);
                
                currentGroup.select(".area")
                    .attr("d", function(d) { return container.area(d.values) })
                    .style("fill", container.opts.colorRange[i])
                    .style("fill-opacity", container.opts.elements.areaOpacity);
                
                container.updateGroup(currentGroup, container.dataLayers[i], i);
            });
        },
        // adds new groups to the chart
        addNewGroups : function(groups) {
            var container = this,
                currentGroup;

            //console.log(groups.length);
            groups.each(function(d, i) {
                currentGroup = d3.select(this);
                //console.log('updating each new group');
                //console.log(d);
                    
                currentGroup.append("path")
                    .attr("class", "line")
                    .attr("d", function(d) { return container.line(d.values) })
                    .style("stroke", container.opts.colorRange[i]);

                currentGroup.append("path")
                    .attr("class", "area")
                    .attr("d", function(d) { return container.area(d.values) })
                    .style("fill", container.opts.colorRange[i])
                    .style("fill-opacity", container.opts.elements.areaOpacity);

                container.updateGroup(currentGroup, d, i);
            });
        },
        updateGroup : function(group, d, i) {
            var container = this,
                elements = container.opts.elements,
                dataStructure = container.opts.dataStructure,
                currentCircles,
                currentSquares;

            if (elements.dot) {
                // get the dots on the line
                currentCircles = group.selectAll(".dot")
                    .data(d.values)

                // current circles
                currentCircles
                    .style("stroke-opacity", 1e-6)
                    .style("fill-opacity", 1e-6)
                    .attr("cx", container.line.x())
                    .attr("cy", container.line.y())
                    .transition()
                  .delay(500)
                    .duration(500)
                    .attr("r", elements.dotRadius)
                    .style("fill", elements.dot)
                    .style("stroke", elements.line)
                    .style("stroke-opacity", 1)
                    .style("fill-opacity", 1);

                // add the new dots
                currentCircles.enter().append("circle")
                    .attr("class", "dot")
                    .attr("cx", container.line.x())
                    .attr("cy", container.line.y())
                    .attr("r", elements.dotRadius)
                    .style("fill", elements.dot)
                    .style("stroke", elements.line)
                    .style("stroke-opacity", 1e-6)
                    .style("fill-opacity", 1e-6)
                    // define the transition of the new circles
                    .transition()
                  .delay(500)
                    .duration(500)
                    .attr("cx", container.line.x())
                    .attr("cy", container.line.y())
                    .style("stroke-opacity", 1)
                    .style("fill-opacity", 1);

                // remove the old ones
                currentCircles.exit()
                    .transition()
                    .duration(500)
                    .style("stroke-opacity", 1e-6)
                    .style("fill-opacity", 1e-6)
                    .remove();
            } 

            if (elements.square) {
                // get the dots on the line
                currentSquares = group.selectAll(".square")
                    .data(d.values);

                // current circles
                currentSquares
                    .style("stroke-opacity", 1e-6)
                    .style("fill-opacity", 1e-6)
                    .attr("x", function(d) {return container.xScale(d[dataStructure.x]) - elements.squareSize/2;})
                    .attr("y", function(d) {return container.yScale(d[dataStructure.y]) - elements.squareSize/2;})
                    .transition()
                  .delay(500)
                    .duration(500)
                    .attr("width", elements.squareSize)
                    .attr("height", elements.squareSize)
                    .style("fill", elements.square)
                    .style("stroke", elements.line)
                    .style("stroke-opacity", 1)
                    .style("fill-opacity", 1);

                // add the new dots
                currentSquares.enter().append("rect")
                    .attr("class", "square")
                    .attr("x", function(d) {return container.xScale(d[dataStructure.x]) - elements.squareSize/2;})
                    .attr("y", function(d) {return container.yScale(d[dataStructure.y]) - elements.squareSize/2;})
                    .attr("width", elements.squareSize)
                    .attr("height", elements.squareSize)
                    .style("fill", elements.square)
                    .style("stroke", elements.line)
                    .style("stroke-opacity", 1e-6)
                    .style("fill-opacity", 1e-6)
                    // define the transition of the new circles
                    .transition()
                  .delay(500)
                    .duration(500)
                    .attr("x", function(d) {return container.xScale(d[dataStructure.x]) - elements.squareSize/2;})
                    .attr("y", function(d) {return container.yScale(d[dataStructure.y]) - elements.squareSize/2;})
                    .style("stroke-opacity", 1)
                    .style("fill-opacity", 1);

                // remove the old ones
                currentSquares.exit()
                  .transition()
                    .duration(500)
                    .style("stroke-opacity", 1e-6)
                    .style("fill-opacity", 1e-6)
                    .remove(); 
                }
        },
        getLine : function() {
            var container = this,
                line = d3.svg.line()
                    //.interpolate("basis")
                    .x(function(d) { return container.xScale(d[container.opts.dataStructure.x]); })
                    .y(function(d) { return container.yScale(d[container.opts.dataStructure.y]); });

            if (container.opts.interpolate) {
                line.interpolate(container.opts.interpolate);
            }
            return line;
        },
        getArea : function() {
            var container = this,
                area = d3.svg.area()
                    //.interpolate("basis")
                    .x(container.line.x())
                    .y1(container.line.y())
                    .y0(container.yScale(0));

            if (container.opts.interpolate) {
                area.interpolate(container.opts.interpolate);
            }
            return area;
        },
        isScaleNumeric : function(scale) {
            // find out whether the scale is numeric or not
            switch(scale) {
                case "linear" :
                    return true;
                    break;
                case "pow" :
                    return true;
                    break;
                case "log" :
                    return true;
                    break;
                case "quanitze" :
                    return true;
                    break;
                case "identity" :
                    return true;
                    break;
                default : 
                    return false;
            }
        },
        parseData : function(data) {
            // I may want to flatten out nested data here. not sure yet
            // if the scale is ordinal, I have to put in an opening value so that I can push the data across the chart
            // the first thing I have to do here is make sure the "value" field is numeric.
            var container = this,
                scaleX = container.opts.scale.x,
                scaleY = container.opts.scale.y,
                dataLength = data.length;

            if (container.isScaleNumeric(scaleX)) {
                for (var i = 0; i < dataLength; i++) {
                    // parse the x scale
                    data[i][container.opts.dataStructure.x] = parseFloat(data[i][container.opts.dataStructure.x]);
                }
            }

            if (container.isScaleNumeric(scaleY)) {
                for (var j = 0; j < dataLength; j++) {
                    // parse the y scale
                    data[j][container.opts.dataStructure.y] = parseFloat(data[j][container.opts.dataStructure.y]);
                }
            }

            // var parseDate = d3.time.format("%d-%b-%y").parse;
            // if there is a date range then parse the data as a date
            if (container.opts.scale.x === "date") {
                for (var i = 0; i < dataLength; i++) {
                    data[i][container.opts.dataStructure.x] = d3.time.format(container.opts.dateFormat).parse(data[i][container.opts.dataStructure.x]);
                }
            }
            if (container.opts.scale.y === "date") {
                for (var j = 0; j < dataLength; j++) {
                    data[j][container.opts.dataStructure.y] = d3.time.format(container.opts.dateFormat).parse(data[j][container.opts.dataStructure.y]);
                }
            }

            // define the stack layout
            container.stack = d3.layout.stack()
                .offset(container.opts.offset)
                .values(function(d) { return d.values; })
                .x(function(d) { return d[container.opts.dataStructure.x]; })
                .y(function(d) { return d[container.opts.dataStructure.y]; })

            container.nest = d3.nest()
                .key(function(d) { return d[container.opts.dataStructure.key]; });
            //console.log(container.nest.entries(data));
            container.dataLayers = container.stack(container.nest.entries(data));
            //console.log(container.dataLayers);
            
            return data;
        },
        setScale : function() {
            var container = this,
                elements = container.opts.elements,
                xRangeMin = elements.xAxis.rangeMin || 0,
                yRangeMin = elements.yAxis.rangeMin || 0,
                xRangeMax = elements.xAxis.rangeMax || container.width,
                yRangeMax = elements.yAxis.rangeMax || container.height,
                xStructure = container.opts.dataStructure.x,
                yStructure = container.opts.dataStructure.y,
                xScaleOpts = container.opts.scale.x,
                yScaleOpts = container.opts.scale.y;

            // set the X scale
            if (xScaleOpts === "date") {
                container.xScale = d3.time.scale();
                container.xScale
                    .domain(d3.extent(container.data, function(d) { return d[xStructure]; }))
                    .range([xRangeMin, xRangeMax]);
            }
            else {
                container.xScale = d3.scale[xScaleOpts]();
            }
            if (xScaleOpts === "linear") {
                // setting the X scale domain to go from the min value to the max value of the data.x set
                // if multiple areas on the chart, I will have to check all data sets before settings the domain
                container.xScale
                    .domain([
                        d3.min(container.data, function(d) { return d[xStructure]; }),
                        d3.max(container.data, function(d) { return d[xStructure]; })
                    ])
                    // set the range to go from 0 to the width of the chart
                    .range([xRangeMin, xRangeMax]);
            }            
            else if (xScaleOpts === "ordinal") {
                container.xScale
                    .domain(container.data.map(function(d) { return d[xStructure]; }))
                    .rangeRoundBands([xRangeMin, xRangeMax], 0.01);
            }
            // hopefully I can fit into one of the two current treatments
            else if (xScaleOpts === "pow") {
            }


            // if the scale is ordinal then add the rangeBounds - e.g.: .rangeRoundBands([0, width], .1);  (http://bl.ocks.org/3885304)
            if (yScaleOpts === "date") {
                container.yScale = d3.time.scale();
                container.yScale
                    .domain(d3.extent(container.data, function(d) { return d[yStructure] }))
                    .range([yRangeMax, yRangeMin]);
            }
            else {
                container.yScale = d3.scale[container.opts.scale.y]();
            }
            // setting the Y scale domain to go from 0 to the max value of the data.y set
            if (yScaleOpts === "linear") {
                container.yScale
                    .domain([
                        0,
                        d3.max(container.data, function(d) { return d[yStructure]; })
                    ])
                    // set the range to go from 0 to the height of the chart
                    .range([yRangeMax, yRangeMin]);
            }            
            else if (yScaleOpts === "ordinal") {
                container.yScale
                    .domain([
                        0, 
                        d3.max(container.data, function(d) { return d[yStructure]; } )])
                    .range([yRangeMax, yRangeMin]);
            }
            // hopefully I can fit into one of the two current treatments
            else if (yScaleOpts === "pow") {
            }
        },
        setAxis : function() {
            var container = this;
            // need to add tick options here
            container.xAxis = d3.svg.axis()
                .scale(container.xScale)
                .ticks(container.opts.dataStructure.ticksX)
                .tickSize(container.opts.elements.xAxis.tickSize)
                .orient("bottom");

            container.yAxis = d3.svg.axis()
                .scale(container.yScale)
                .ticks(container.opts.dataStructure.ticksY)
                .tickSize(container.opts.elements.yAxis.tickSize)
                .orient("left");
        },
        // updates the data set for the chart
        updateData : function(data) {
            var container = this;

            container.opts.dataUrl = data;
            this.getData();
        },
        // gets data from a JSON request
        getData : function() {
            var container = this;
            
            // check to see where the data is coming from
            if (container.opts.dataUrl) {
                // get the file extension
                var regex = /\.([0-9a-z]+)(?:[\?#]|$)/i;
                var urlExt = container.opts.dataUrl.substring((container.opts.dataUrl.length - 5));
                var fileType = urlExt.match(regex)[0];
                
                if (fileType === ".json") {
                    d3.json(container.opts.dataUrl, function(error, data) {
                        container.data = container.parseData(data);
                        container.updateChart(); 
                    });
                }
                else if (fileType === ".csv") {
                    d3.csv(container.opts.dataUrl, function(error, data) {
                        // will organise the data into groups taking the keys out of the first row
                        container.data = container.parseData(data);
                        container.updateChart(); 
                    });
                }
                else if (fileType === ".tsv") {
                    d3.csv(container.opts.dataUrl, function(error, data) {
                        container.data = container.parseData(data);
                        container.updateChart(); 
                    });
                }
            } else {
                // the data is passed straight into the plugin form either a function or a data object
                // I expect a JSON object here
                container.data = container.parseData(container.opts.data);
                //console.log(container.data);
                container.updateChart(); 
            }    
        },
        // updates the settings of the chart
        settings : function(settings) {
            // the data object is giving to much recursion on the Extend function.
            // will have to manually clean it if more data is being set
            if (settings.data) {
                this.opts.data = null;
            }
            // I need to sort out whether I want to refresh the graph when the settings are changed
            this.opts = Extend(true, {}, this.opts, settings);
            // will make custom function to handle setting changes
            this.getData();
        },
        destroy : function() {
            this.el.removeAttribute(this.namespace);
            this.el.removeChild(this.el.children[0]);
            this.el[this.namespace] = null;
        }     
    };
    
    // the plugin bridging layer to allow users to call methods and add data after the plguin has been initialised
    // props to https://github.com/jsor/jcarousel/blob/master/src/jquery.jcarousel.js for the base of the code & http://isotope.metafizzy.co/ for a good implementation
    d3.area = function(element, options, callback) {
        // define the plugin name here so I don't have to change it anywhere else. This name refers to the jQuery data object that will store the plugin data
        var pluginName = "area",
            args;

        function applyPluginMethod(el) {
            var pluginInstance = el[pluginName];   
            // if there is no data for this instance of the plugin, then the plugin needs to be initialised first, so just call an error
            if (!pluginInstance) {
                alert("The plugin has not been initialised yet when you tried to call this method: " + options);
                //return;
            }
            // if there is no method defined for the option being called, or it's a private function (but I may not use this) then return an error.
            if (typeof pluginInstance[options] !== "function" || options.charAt(0) === "_") {
                alert("the plugin contains no such method: " + options);
                //return;
            }
            // apply the method that has been called
            else {
                pluginInstance[options].apply(pluginInstance, args);
            }
        };

        function initialisePlugin(el) {
            // define the data object that is going to be attached to the DOM element that the plugin is being called on
            // need to create a global data holding object. 
            var pluginInstance = el[pluginName];
            // if the plugin instance already exists then apply the options to it. I don't think I need to init again, but may have to on some plugins
            if (pluginInstance) {
                // going to need to set the options for the plugin here
                pluginInstance.settings(options);
            }
            // initialise a new instance of the plugin
            else {
                el.setAttribute(pluginName, true);
                // I think I need to anchor this new object to the DOM element and bind it
                el[pluginName] = new d3.Area(options, el, callback);
            }
        };
        
        // if the argument is a string representing a plugin method then test which one it is
        if ( typeof options === 'string' ) {
            // define the arguments that the plugin function call may make 
            args = Array.prototype.slice.call(arguments, 2);
            // iterate over each object that the function is being called upon
            if (element.length) {
                for (var i = 0; i < element.length; i++) {
                    applyPluginMethod(element[i]);
                };
            }
            else {
                applyPluginMethod(element);
            }
            
        }
        // initialise the function using the arguments as the plugin options
        else {
            // initialise each instance of the plugin
            if (element.length) {
                for (var i = 0; i < element.length; i++) {
                    initialisePlugin(element[i]);
                }
            }
            else {
                initialisePlugin(element);
            }
        }
        return this;
    };
// end of module
})(d3);