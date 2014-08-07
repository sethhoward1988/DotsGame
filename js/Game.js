
var Game = function (options) {
    for(option in options){
        this[option] = options[option];
    }
    this.setup();
    this.buildDataStructure();
    this.buildUI();
    this.update();
    this.activePlayer = this.playerTurn.activePlayer;
}

Game.prototype = {

    players: 2,

    gridSize: 4,

    size: 600,

    padding: {
        top: 50,
        right: 50,
        bottom: 50,
        left: 50
    },

    circleRadius: 10,

    linesData: [],

    squaresData: [],

    consumedMoves: [],

    squareAnalysis: {},

    el: null,

    buildDataStructure: function () {
        this.data = [];
        for(var i = 0; i < this.gridSize; i++){
            var column = [];
            for(var j = 0; j < this.gridSize; j++){
                column.push(function(i, j){
                    return {
                        column: i,
                        row: j,
                        connections: [],
                        id: 'C' + i + 'R' + j
                    }
                }(i, j));
            }
            this.data.push(column);
        }

        this.totalSquares = (this.gridSize-1) * (this.gridSize - 1);

        for(var i = 0; i < this.totalSquares; i++){
            var that = this;

            var a = function (num) {
                that.squareAnalysis['square' + num] = 0;    
            }(i)
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

    analyzeBoard: function () {

    },

    updateSquareAnalysis: function (dFrom, dTo) {
        var affectedSquares = [];
        var that = this;
        var score = 0;
        if(dFrom.column == dTo.column) {
            // Vertical Orientation
            var affectedRow = dFrom.row < dTo.row ? dFrom.row : dTo.row;
            var baseSquare = affectedRow * (this.gridSize - 1);
            if(this.gridSize == (dFrom.column + 1)){
                affectedSquares.push(baseSquare + (dFrom.column - 1));    
            } else if (dFrom.column == 0) {
                affectedSquares.push(baseSquare + dFrom.column);
            } else {
                affectedSquares.push(baseSquare + dFrom.column);
                affectedSquares.push(baseSquare + (dFrom.column - 1));    
            }
        } else {
            // Horizontal
            var affectedColumn = dFrom.column < dTo.column ? dFrom.column : dTo.column;
            var possibilities = function () {
                var possibilities = [];
                var count = affectedColumn;
                possibilities.push(count);
                while(count + (that.gridSize-1) <= that.totalSquares - 1){
                    count += (that.gridSize-1);
                    possibilities.push(count);
                }
                return possibilities;
            }()

            if(dFrom.row == (this.gridSize - 1)){
                affectedSquares.push(possibilities[dFrom.row - 1]);
            } else if (dFrom.row == 0) {
                affectedSquares.push(possibilities[dFrom.row]);
            } else {
                affectedSquares.push(possibilities[dFrom.row]);
                affectedSquares.push(possibilities[dFrom.row - 1]);
            }
        }

        for(var i = 0; i < affectedSquares.length; i++){
            this.squareAnalysis['square' + affectedSquares[i]]++;
            if(this.squareAnalysis['square' + affectedSquares[i]] == 4){
                var b = function (squareNumber) {
                    that.squaresData.push(squareNumber);
                    score++;
                }(affectedSquares[i]);
            }
        }

        if(score){
            this.activePlayer.incrementScore(score);
        }
        
        this.updateSquares();
    },

    updateSquares: function () {
        var that = this;
        var squares = this.gSquares.selectAll('rect')
            .data(this.squaresData);

        squares.enter().append('rect')
            .attr('class', 'square')
            .attr('x', function (d) {
                var column = Math.floor(d % (that.totalSquares / (that.gridSize-1)))
                return that.xScale(column);
            })
            .attr('y', function (d) {
                var row = Math.floor(d / (that.totalSquares / (that.gridSize-1)))
                return that.yScale(row)
            })
            .attr('width', function (d) {
                return that.xScale(1) - that.xScale(0);
            })
            .attr('height', function (d) {
                return that.xScale(1) - that.xScale(0);  
            })
            .attr('fill', this.activePlayer.getColor());
    },

    buildUI: function () {
        this.el.width(this.width);
        this.el.height(this.height);

        this.svg = d3.select(this.el[0]).append('svg')
                .attr('width', this.width)
                .attr('height', this.height)
            .append('g')
                .attr('class', 'game-container')
                .attr('transform', 'translate(' + this.padding.left + ',' + this.padding.top + ')');

        this.gSquares = this.svg.append('g')
            .attr('class', 'squares-container');

        this.gLines = this.svg.append('g')
            .attr('class', 'lines-container');

        this.gDragLine = this.svg.append('g')
            .attr('class', 'drag-line-container');

        this.gCircle = this.svg.append('g')
            .attr('class', 'circles-container');

        this.gameOffset = $('.game-container').offset();

    },

    setScales: function () {
        this.xScale = d3.scale.linear()
            .range([0, this.width])

        this.yScale = d3.scale.linear()
            .range([0, this.height]);

        this.xScale.domain([0, this.gridSize]);
        this.yScale.domain([0, this.gridSize]);
    },

    setDrag: function () {
        this.drag = d3.behavior.drag()
            .origin(function(d) {
                return d;
            })
            .on('dragstart', this.onDragStart)
            .on('drag', this.onDrag)
            .on('dragend', this.onDragEnd);
    },

    update: function () {
        var that = this;

        // Data Join
        var circles = this.gCircle.selectAll('circle')
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
            .attr('r', 0)
            .on('mouseover', function (d) {
                if(that.mouseDown){
                    if(that.isLegalMove(d)){
                        that.addClass(this, 'option-legal');    
                    } else {
                        that.addClass(this, 'option-illegal');        
                    }
                } else {
                    that.addClass(this, 'option-hover');    
                }
                
            })
            .on('mouseout', function (d) {
                that.dLegalMove = null;
                that.removeClass(this, 'option-hover', 'option-legal', 'option-illegal');
            })
            .call(this.drag);

        // Enter and Update
        circles.transition().duration(700)
            .attr('r', this.circleRadius);

        // Exit
        circles.exit().transition()
            .attr('r', 0)
            .remove();
    },

    isLegalMove: function (d) {
        // see if from this.dActiveCircle to d is legitimate...
        var legalMoves = '';
        var column = this.dActiveCircle.column;
        var row = this.dActiveCircle.row;

        if(_.indexOf(this.consumedMoves, this.dActiveCircle.id + d.id) >= 0){
            return false;
        }

        if(column > 0){
            if(column < this.gridSize){
                legalMoves += ('C' + (column - 1) + 'R' + row);  
                legalMoves += ('C' + (column + 1) + 'R' + row);
            } else {
                legalMoves += ('C' + (column - 1) + 'R' + row);
            }
        } else {
            legalMoves += ('C' + (column + 1) + 'R' + row);
        }

        if(row > 0) {
            if(row < this.gridSize){
                legalMoves += ('C' + column + 'R' + (row - 1));
                legalMoves += ('C' + column + 'R' + (row + 1));
            } else {
                legalMoves += ('C' + column + 'R' + (row - 1));
            }
        } else {
            legalMoves += ('C' + column + 'R' + (row + 1));
        }

        var isLegal = legalMoves.indexOf(d.id) >= 0 ? true : false;

        if(isLegal){
            this.dLegalMove = d;
        } else {
            this.dLegalMove = null;
        }

        return isLegal;
    },

    updateLines: function () {
        var that = this;

        // Data Join
        var lines = this.gLines.selectAll('line')
            .data(this.linesData)

        lines.transition().duration(200)
            .attr('x1', function (d) { 
                return that.xScale(d.dFrom.column) 
            })
            .attr('y1', function (d) { return that.yScale(d.dFrom.row) })
            .attr('x2', function (d) { return that.xScale(d.dTo.column) })
            .attr('y2', function (d) { return that.yScale(d.dTo.row) })
    },

    // EVENTS

    onDragStart: function (dCircle) {
        this.mouseDown = true;
        this.dActiveCircle = dCircle;
        this.$activeCircle = $(event.toElement);
        this.addClass(this.$activeCircle, 'active');
        var that = this;
        this.lineData = {
            x: [this.xScale(dCircle.column), this.xScale(dCircle.column)],
            y: [this.yScale(dCircle.row), this.yScale(dCircle.row)]
        }

        this.lineSelection = this.gDragLine.selectAll('line')
            .data([this.lineData])

        this.lineSelection.enter().append('line')
            .attr('x1', function (d) { return d.x[0] })
            .attr('y1', function (d) { return d.y[0] })
            .attr('x2', function (d) { return d.x[1] })
            .attr('y2', function (d) { return d.y[1] })
            .attr('stroke-width', 5)
            .attr('stroke', this.activePlayer.getColor());
    },

    onDrag: function () {
        var event = d3.event.sourceEvent;
        this.lineData.x[1] = event.x - this.gameOffset.left - this.padding.left;
        this.lineData.y[1] = event.y - this.gameOffset.top - this.padding.top;
        this.lineSelection
            .attr('x1', function (d) { return d.x[0] })
            .attr('y1', function (d) { return d.y[0] })
            .attr('x2', function (d) { return d.x[1] })
            .attr('y2', function (d) { return d.y[1] });
    },

    onDragEnd: function () {
        this.mouseDown = false;
        this.removeClass(this.$activeCircle, 'active');
        // Determine if it's a legitimate connection and push to permanent lines data, run update
        if(this.dLegalMove){
            var line = this.lineSelection[0][0];
            $(this.gLines[0][0]).append(line);
            this.linesData.push({
                dFrom: _.clone(this.dActiveCircle),
                dTo: _.clone(this.dLegalMove)
            });
            this.consumedMoves.push(this.dActiveCircle.id + this.dLegalMove.id);
            this.consumedMoves.push(this.dLegalMove.id + this.dActiveCircle.id);
            this.updateLines();
            this.updateSquareAnalysis(this.dActiveCircle, this.dLegalMove);
            this.analyzeBoard();
            this.dActiveCircle = null;
            this.dLegalMove = null;
            this.endTurn();
        } else {
            // If it's not legitimate
            this.lineSelection.transition().duration(400)
                .attr('x1', function (d) { return d.x[0] })
                .attr('y1', function (d) { return d.y[0] })
                .attr('x2', function (d) { return d.x[0] })
                .attr('y2', function (d) { return d.y[0] })
                .remove();
        }
    },

    endTurn: function () {
        this.playerTurn.next();
        this.activePlayer = this.playerTurn.activePlayer;
    },

    setBindings: function () {
        this.onDragStart = _.bind(this.onDragStart, this);
        this.onDrag = _.bind(this.onDrag, this);
        this.onDragEnd = _.bind(this.onDragEnd, this);
    },

    setWidthAndHeight: function () {
        this.width = this.size - this.padding.right - this.padding.left;
        this.height = this.size - this.padding.top - this.padding.bottom;
    },

    setup: function () {
        this.setBindings();
        this.setWidthAndHeight();
        this.setScales();
        this.setDrag();
    },

    // Utility Methods
    addClass: function (el) {
        el = $(el);
        for(var i = 1; i < arguments.length; i++){
            el.attr('class', el.attr('class') + ' ' + arguments[i]);    
        }
        
    },

    removeClass: function (el) {
        el = $(el);
        for(var i = 1; i < arguments.length; i++){
            el.attr('class', el.attr('class').replace(' ' + arguments[i],''));
        }
        
    }
}
