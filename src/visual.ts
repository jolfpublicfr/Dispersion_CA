
module powerbi.extensibility.visual {
    "use strict";
    interface DataPoint {
        category: number;
        value: number;
        identity:powerbi.visuals.ISelectionId;
        key: number;
    };

    interface DataObject {
        key: number;
        score: number;
        //identity:powerbi.visuals.ISelectionId;
    };

    interface ViewModel {
        dataPoints: DataPoint[];
        maxValue: number;
        minValue: number;
    }
    export class Visual implements IVisual {

        private settings: VisualSettings;

        private host: IVisualHost;
        private svg: d3.Selection<SVGAElement>;
        private content:any;
        private margin:any;
        private width:number;
        private height:number;
        private barsGroup: d3.Selection<SVGAElement>;
        private topData:Array<DataPoint>;
        private yScale:any;
        private xScale:any;
        private yAxis:any;
        private xAxis:any;
        private xAxisRender:any;
        private yAxisRender:any;



        constructor(options: VisualConstructorOptions) {

            this.content = options.element;
            this.host = options.host;
			
			this.margin = {top: 30, right: 20, bottom: 30, left: 20, mid: 20};
            this.width = this.content.offsetWidth  - this.margin.left - this.margin.right - 20;
            this.height = this.content.offsetHeight - this.margin.top  - this.margin.bottom;
            
            var div1 = document.createElement("div");
            div1.className = "outer-wrapper";
            var div2 = document.createElement("div");
            div2.className = "chart";
			
			
            this.content.appendChild(div1);
            div1.appendChild(div2);


            this.svg = d3.select(".outer-wrapper .chart")
                .append("svg");
            
             this.barsGroup = this.svg.append('g')
                                .attr("class","barsGroup")
                                ;
            
            this.yAxisRender = this.svg.append('g').attr("class", "y axis");

            this.xAxisRender = this.svg.append('g').attr("class", "x axis");


			//Draw the line    
            this.svg.append("line")
                        .attr("id", "xline")
                          .attr("x1", this.margin.left)
                          .attr("y1", this.margin.top + this.height + 10)
                         .attr("x2", this.margin.left + this.width)
                         .attr("y2", this.margin.top + this.height + 10)
                         .attr("stroke-width", 1)
                         .attr("stroke", "gray");
				 
        }

        public update(options: VisualUpdateOptions) {
 
            let viewModel: ViewModel = this.getViewModel(options, this.host);
            this.topData = viewModel.dataPoints;
			
            var margin = this.margin; 
            var height = this.height;
            var width = this.width;

            var width = options.viewport.width;
            var height = options.viewport.height;
            this.width = width;
            this.height = height;

            this.svg.select("#xline")
            .attr("x2", this.margin.left + this.width)
            .attr("y1", this.height - 20)
            .attr("y2", this.height - 20);
             
            this.svg.attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top  + margin.bottom);
             
            this.barsGroup.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
            
            this.yScale = d3.scale.linear()
                .range([height, 0])
                .domain([0, d3.max(this.topData, function(d) { 
                    return d.value;
            })]);
 
			 this.xScale  = d3.scale.linear()
             .range([width, 0])
             .domain([d3.max(this.topData, function(d) { 
                 return d.category;
            }), 0]);
 
             /*	Define y axis */
            this.yAxis = d3.svg.axis()
                 .scale(this.yScale)
                 .tickSize(0, 0)
                 .ticks(0)
                 .orient("left");
			 
			 
             this.xAxis = d3.svg.axis()
                 .scale(this.xScale)
                 .orient("bottom");
            
             /*	Prepare the y axis but do not call .call(xAxis) yet */
             this.yAxisRender
                 .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
                 .append("g")
                 .attr("class", "axisLabel")
            
             /* Prepare the x axis */
             this.xAxisRender
                 .attr("transform", "translate(" + margin.left + "," + (height - 20) + ")" )
                 .call(this.xAxis)
                 .append("g")
                 .attr("class", "axisLabel");
                 
             this.updateBars(this.topData, 0);
				
		}
        
        private updateGraph (grp, data) {
            var xScale = this.xScale;
            var yScale = this.yScale;
            var height = this.height;
            var margin = this.margin;
            try{
                grp.selectAll("rect").data(data, function (d) {
                    return d.key;
                })
                .attr("x", function (d, i) {
                    return xScale(d.category);
                })
                .attr("width", function (d) {
                    return 5;
                })
                .attr("y", function (d){
                    return yScale(d.value);
                })
                .attr("height", function (d) {
                    return height - 2 * margin.top - yScale(d.value);
                })
				.attr("fill", function (d, i){
					return d.value == 2? "#00a59f" :"#a87caf";
                });
            }catch(e){
                console.log(e);
            }
            
        }
        
        private enter (grp, data) {
            var xScale = this.xScale;
            var yScale = this.yScale;
            var height = this.height;
            var margin = this.margin;
            try{
                grp.selectAll("rect").data(data, function (d) {
                    return d.key;
                })
                .enter()
                .append("rect")
                .attr("x", function (d, i) {
					
                    return xScale(d.category);
                })
                .attr("width", function(d) {
                    return 5;
                })
                .attr("y", function (d){
                    return yScale(d.value);
                })
                .attr("height", function (d) {
                    return height - 2 * margin.top - yScale(d.value);
                })
                .attr("fill", function (d, i){
					return d.value == 2? "#00a59f" :"#a87caf";
				})
                .attr("opacity", function () {
                    return 1;
                });
            }catch(e){
                console.log(e);
            }
            
        }
        
        private exit (grp, data:Array<DataPoint>) {
            grp.selectAll("rect").data(data, function (d) {
                    return d.key;
                }).exit()
                .remove();
        }
        
        private updateBars (data:Array<DataPoint>, start) {
            var yAxis = this.yAxis;
            this.xScale.domain([d3.max(data, function(d) { return d.category;}), 0]);
            this.yScale.domain([0, d3.max(data, function(d) { return d.value;})]);
        
            /* Update */
            this.updateGraph(this.barsGroup, data);
        
            /* Enter… */
            this.enter(this.barsGroup, data);
        
            /* Exit */
            this.exit(this.barsGroup, data);
        
            /* Call the Y axis to adjust it to the new scale */
            this.svg.select(".outer-wrapper .chart .y")
                .transition()
                .duration(10)
                .call(yAxis);
			
        }
        
        

        private getViewModel(options:VisualUpdateOptions, argHost:IVisualHost):ViewModel{
            let dataView = options.dataViews;
            let retDataView : ViewModel={
                dataPoints:[],
                maxValue:0,
                minValue:0
            }

            if(!dataView || !dataView[0] 
                || !dataView[0].categorical || !dataView[0].categorical.categories
                || !dataView[0].categorical.categories[0].source 
                || !dataView[0].categorical.values)
                return retDataView;
            let view = dataView[0].categorical;
            let categories=view.categories[0];
            let values = view.values[0];
            let len = Math.max(categories.values.length, values.values.length);
            for (let i = 0; i < len; i++) {
               retDataView.dataPoints.push({
                   category:<number>categories.values[i],
                   value:<number>values.values[i],
                   identity:argHost.createSelectionIdBuilder().withCategory(categories,i).createSelectionId(),
                   key:i
               });
                
            }
            retDataView.maxValue=d3.max(retDataView.dataPoints, d=>d.value);
            retDataView.minValue=d3.min(retDataView.dataPoints, d=>d.value);
			retDataView.dataPoints.sort((a,b)=>(+a.category)-(+b.category));
            return retDataView;
        }

        public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstance[] | VisualObjectInstanceEnumerationObject {
            return VisualSettings.enumerateObjectInstances(this.settings || VisualSettings.getDefault(), options);
        }
    }
} 