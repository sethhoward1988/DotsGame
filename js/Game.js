
var Game = function (options, events, dataModel, isResume) {
    for(option in options){
        this[option] = options[option];
    }
    this.events = events;
    this.dataModel = dataModel;
    this.setup();
    this.buildDataStructure();
    this.buildUI();
    this.createDots();
}

Game.prototype = {

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

    consumedMoves: '',

    squaresAnalysis: {},

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
                that.squaresAnalysis['square' + num] = 0;    
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

    updateSquaresAnalysis: function (dFrom, dTo) {
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
            this.squaresAnalysis['square' + affectedSquares[i]]++;
            if(this.squaresAnalysis['square' + affectedSquares[i]] == 4){
                var b = function (squareNumber) {
                    that.squaresData.push({
                        number: squareNumber,
                        color: that.playerTurn.activePlayer.color
                    });
                    score++;
                }(affectedSquares[i]);
            }
        }

        if(score){
            this.playerTurn.incrementScore(score);
            this.continuePlay = true;
        } else {
            this.continuePlay = false;
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
                var column = Math.floor(d.number % (that.totalSquares / (that.gridSize-1)))
                return that.xScale(column);
            })
            .attr('y', function (d) {
                var row = Math.floor(d.number / (that.totalSquares / (that.gridSize-1)))
                return that.yScale(row)
            })
            .attr('width', function (d) {
                return that.xScale(1) - that.xScale(0);
            })
            .attr('height', function (d) {
                return that.xScale(1) - that.xScale(0);  
            })
            .attr('fill', function (d) {
                return d.color;
            });
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

    updateAll: function () {
        this.updateSquares();
        this.updateLines();
    },

    createDots: function () {
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
                if(!that.myTurn){
                    return;
                }
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
                if(!that.myTurn){
                    return;
                }
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

        if(this.consumedMoves.indexOf(this.dActiveCircle.id + d.id) >= 0){
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

        lines.enter().append('line')
            .attr('x1', function (d) { 
                return that.xScale(d.dFrom.column) 
            })
            .attr('y1', function (d) { return that.yScale(d.dFrom.row) })
            .attr('x2', function (d) { return that.xScale(d.dTo.column) })
            .attr('y2', function (d) { return that.yScale(d.dTo.row) })
            .attr('stroke-width', 5)
            .attr('stroke', function (d) { return d.color })
            .style('opacity', 0)

        lines.transition().duration(200)
            .attr('x1', function (d) { 
                return that.xScale(d.dFrom.column) 
            })
            .attr('y1', function (d) { return that.yScale(d.dFrom.row) })
            .attr('x2', function (d) { return that.xScale(d.dTo.column) })
            .attr('y2', function (d) { return that.yScale(d.dTo.row) })
            .style('opacity', 1)
    },

    // EVENTS

    onDragStart: function (dCircle) {
        var that = this;
        if(!that.myTurn){
            return;
        }
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
            .attr('stroke', this.playerTurn.activePlayer.color);
    },

    onDrag: function () {
        var that = this;
        if(!that.myTurn){
            return;
        }
        this.lineData.x[1] = this.lineData.x[1] + d3.event.dx;
        this.lineData.y[1] = this.lineData.y[1] + d3.event.dy;
        this.lineSelection
            .attr('x1', function (d) { return d.x[0] })
            .attr('y1', function (d) { return d.y[0] })
            .attr('x2', function (d) { return d.x[1] })
            .attr('y2', function (d) { return d.y[1] });
    },

    onDragEnd: function () {
        var that = this;
        if(!that.myTurn){
            return;
        }
        this.mouseDown = false;
        this.removeClass(this.$activeCircle, 'active');
        // Determine if it's a legitimate connection and push to permanent lines data, run update
        if(this.dLegalMove){
            var line = this.lineSelection[0][0];
            $(this.gLines[0][0]).append(line);
            this.linesData.push({
                color: this.playerTurn.activePlayer.color,
                dFrom: _.clone(this.dActiveCircle),
                dTo: _.clone(this.dLegalMove)
            });
            this.consumedMoves += (this.dActiveCircle.id + this.dLegalMove.id);
            this.consumedMoves += (this.dLegalMove.id + this.dActiveCircle.id);
            this.updateLines();
            this.updateSquaresAnalysis(this.dActiveCircle, this.dLegalMove);
            this.dActiveCircle = null;
            this.dLegalMove = null;
            if(!this.continuePlay){
                this.endTurn();
            }
            this.sendMove();
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
        if(this.myTurn){
            this.myTurn = false;
        }
    },

    setBindings: function () {
        this.onDragStart = _.bind(this.onDragStart, this);
        this.onDrag = _.bind(this.onDrag, this);
        this.onDragEnd = _.bind(this.onDragEnd, this);
        this.receiveMove = _.bind(this.receiveMove, this);
        this.onMyTurn = _.bind(this.onMyTurn, this);
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
        this.turnChangeSubscription = this.events.subscribe(this.onMyTurn, 'myTurn');
        this.receiveMovedSubscription = this.events.subscribe(this.receiveMove, 'receiveMove');
    },

    onMyTurn: function () {
        this.myTurn = true;
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
    },

    sendMove: function () {
        this.dataModel.setGameData(
            this.consumedMoves,
            this.linesData,
            this.squaresData,
            this.squaresAnalysis);
    },

    receiveMove: function (consumedMoves, linesData, squaresData, squaresAnalysis) {
        this.consumedMoves = consumedMoves;
        this.linesData = linesData;
        this.squaresData = squaresData;
        this.squaresAnalysis = squaresAnalysis;
        this.updateAll();
    },

    destroy: function () {
        this.events.unsubscribe('dataChange', dataChangeSubscription);
    }
}
