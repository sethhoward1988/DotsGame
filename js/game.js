
(function (el) {

	var app = {

        players: 2,

        gridSize: 4,

        size: 600,

        padding: {
            top: 50,
            right: 50,
            bottom: 50,
            left: 50
        },

        el: el,

        buildDataStructure: function () {
            this.data = [];
            for(var i = 0; i < this.gridSize; i++){
                var column = [];
                for(var j = 0; j < this.gridSize; j++){
                    column.push(function(i, j){
                        return {
                            column: i,
                            row: j,
                            connections: []
                        }
                    }(i, j));
                }
                this.data.push(column);
            }
        },

        convertDataStructureForD3: function () {
            var data = [];
            for(var i = 0; i < this.data.length; i++){
                for(var j = 0; j < this.data[i].length; j++){
                    data.push(this.data[i][j]);
                }
            }
            return data;
        },

        buildUI: function () {
            this.container = $('<div class="game-container"></div>');
            this.el.append(this.container);
            this.container.width(this.width);
            this.container.height(this.height);

            this.svg = d3.select(this.container[0]).append('svg')
                    .attr('width', this.width)
                    .attr('height', this.height)
                .append('g')
                    .attr('class', 'game-container')
                    .attr('transform', 'translate(' + this.padding.left + ',' + this.padding.top + ')');
        },

        setScales: function () {
            this.xScale = d3.scale.linear()
                .range([0, this.width])

            this.yScale = d3.scale.linear()
                .range([0, this.height]);

            this.xScale.domain([0, this.gridSize]);
            this.yScale.domain([0, this.gridSize]);
        },

        update: function () {
            var that = this;

            // Data Join
            var circles = this.svg.selectAll('circle')
                .data(this.convertDataStructureForD3());

            // Update

            // Enter
            circles.enter().append('circle')
                .attr('class', 'dot')
                .attr('cx', function (d, i) {
                    return that.xScale(d.column);
                })
                .attr('cy', function (d, i) {
                    return that.yScale(d.row);
                })
                .attr('r', 0);

            // Enter and Update
            circles.transition().duration(700)
                .attr('r', 10);

            // Exit
            circles.exit().transition()
                .attr('r', 0)
                .remove();

        },

        setBindings: function () {

        },

        setWidthAndHeight: function () {
            this.width = this.size - this.padding.right - this.padding.left;
            this.height = this.size - this.padding.top - this.padding.bottom;
        },

        setup: function () {
            this.setBindings();
            this.setWidthAndHeight();
            this.setScales();
        },

        start: function () {
            this.setup();
            this.buildDataStructure();
            this.buildUI();
            this.update();
        }
	}

    app.start();

    return app;

})($('body'));
