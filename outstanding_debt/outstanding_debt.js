// inspiration from https://bl.ocks.org/mbostock/3885304

var myData;

// function from https://bl.ocks.org/mbostock/7555321 for wrapping text
function wrap(text, width) {
  text.each(function() {
    var text = d3.select(this),
        words = text.text().split(/\s+/).reverse(),
        word,
        line = [],
        lineNumber = 0,
        lineHeight = 1.1, // ems
        y = text.attr("y"),
        dy = parseFloat(text.attr("dy")),
        tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em");
    while (word = words.pop()) {
      line.push(word);
      tspan.text(line.join(" "));
      if (tspan.node().getComputedTextLength() > width) {
        line.pop();
        tspan.text(line.join(" "));
        line = [word];
        tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
      }
    }
  });
}


// function to call on the data
plotData = function(error, data, dataType) {
  if (error) throw error;

  myData = data;

  /* Initial Setup */

  // Constants for sizing
  var w = window,
      d = document,
      e = d.documentElement,
      g = d.getElementsByTagName('body')[0],
      x = w.innerWidth || e.clientWidth || g.clientWidth,
      y = w.innerHeight|| e.clientHeight|| g.clientHeight;

  // maintain a ratio of 2.5 width to 1 height, but scale to window. Max width of 1000.
  var width = d3.min([1000, y * 1.2, x * 0.75]);
  var height = width / 2.5;

  // scale the toolbars
  var label_size = d3.min([d3.max([12, (height / 15)]), 18]) + "px",
      entry_size = d3.min([d3.max([10, (height / 20)]), 16]) + "px",
      heading_size = d3.min([d3.max([16, (height / 10)]), 46]) + "px";
  d3.selectAll('#heading').style('font-size', heading_size);
  d3.selectAll('.toolbar_label').attr('style', "padding:0px 0px 0px 10px; font-weight: bold; font-size: " + label_size);
  d3.selectAll('.btn-group').selectAll('.btn').attr('style', "font-size: " + entry_size);

  var svg = d3.select("#vis")
    .append("svg")
    .attr('height', height)
    .attr('width', width);

  var graphMargin = {top: 40, right: width * 0.4, bottom: 80, left: 80},
    graphWidth = width - graphMargin.left - graphMargin.right,
    graphHeight = height - graphMargin.top - graphMargin.bottom;

  var x = d3.scaleBand().rangeRound([0, graphWidth]).padding(0.1).paddingInner(0.4),
      y = d3.scaleLinear().rangeRound([graphHeight, 0]);

  var axisTextSize = d3.min([d3.max([8, (graphHeight / 20)]), 15]) + "px"

  var graph = svg.append("g")
      .attr("transform", "translate(" + graphMargin.left + "," + graphMargin.top + ")");

    x.domain(data.map(function(d) { return d.name; }));
    y.domain([0, 0.16]);

  // most recent year of data
  var current_year = d3.max(data.map(function(d) {return d.year}));

  // draw x axis
  graph.append("g")
      .style('font-size', axisTextSize)
      .attr("class", "axis axis--x")
      .attr("transform", "translate(0," + graphHeight + ")")
      .call(d3.axisBottom(x));

  // draw y axis
  graph.append("g")
      .style('font-size', axisTextSize)
      .attr("class", "axis axis--y")
      .call(d3.axisLeft(y).ticks(10, "%"))
      .append("text")
      .classed('yAxisText', true)
      .attr('x', 10)
      .attr('y', -30)
      .attr("dy", "0.71em")
      .attr("fill", "#000")
      .text("");;

  /* initialize bars with zero height */
  // total obligations (although only interest will be visible)
  graph.selectAll('tBar')
    .data(data)
    .enter().append('rect')
    .attr('class', 'bar tBar')
    .attr('x', function(d) {return x(d.name)})
    .attr('y', graphHeight)
    .attr('width', x.bandwidth())
    .attr('height', 0)
    .attr('fill', 'skyblue');

  // bar for principal
  graph.selectAll(".uBar")
    .data(data)
    .enter().append("rect")
    .attr("class", "bar uBar")
    .attr("x", function(d) { return x(d.name); })
    .attr("y", graphHeight)
    .attr("width", x.bandwidth())
    .attr("height", 0)
    .attr('fill', 'steelblue');

  // make legend
  legend = graph.append('g');
  legendX = width * 0.6;
  legendY = graphHeight * 0.25
  legendSize = 0.8 * x.bandwidth();

  // voter-approved debt
  legend.append('rect')
    .attr('x', legendX)
    .attr('y', legendY + legendSize)
    .attr('width', legendSize)
    .attr('height', legendSize)
    .attr('fill', 'skyblue');

  legend.append('text')
    .attr('x', legendX + 1.5 * legendSize)
    .attr('y', legendY + 1.6 * legendSize)
    .attr('font-size', axisTextSize)
    .text('Interest');

  // non-voter-approved debt
  legend.append('rect')
    .attr('x', legendX)
    .attr('y', legendY + 2.5 * legendSize)
    .attr('width', legendSize)
    .attr('height', legendSize)
    .attr('fill', 'steelblue');

  legend.append('text')
    .attr('x', legendX + 1.5 * legendSize)
    .attr('y', legendY + 3.1 * legendSize)
    .attr('font-size', axisTextSize)
    .text('Principal');


  // function for toggling to percentage view
  function drawValues() {
    // set the scale
    var y = d3.scaleLinear().rangeRound([graphHeight, 0]).domain([0, 4500]);

    // change the axis
    d3.selectAll('.axis--y')
        .call(d3.axisLeft(y).ticks(10));

    d3.selectAll('.yAxisText')
        .text('$ (Millions)');

    // transition the bars
    graph.selectAll('.tBar')
      .transition()
      .duration(500)
      .attr('y', function(d) {return y(d.total / 1e6)})
      .attr('height', function(d) {return graphHeight - y(d.total / 1e6); });

    // bar for principal
    graph.selectAll(".uBar")
      .transition()
      .duration(500)
      .attr("y", function(d) { return y(d.principal / 1e6); })
      .attr("height", function(d) { return graphHeight - y(d.principal / 1e6); });


    // add invisible bars for mouseover
    graph.selectAll('.mouseBar')
      .data(data)
      .enter().append("rect")
      .attr("class", "bar mouseBar")
      .attr("x", function(d) { return x(d.name); })
      .attr("y", function(d) { return 10 + y(d.total / 1e6); })
      .attr("width", x.bandwidth())
      .attr("height", function(d) { return 10 + graphHeight - y(d.total / 1e6); })
      .attr('fill', 'none')
      .attr('style','pointer-events:all')
      .on('mouseenter', showFloatingTooltip)
      .on('mouseleave', function() {
        graph.select('.outline').remove();
        floating_tooltip.hideTooltip();
      });


  }

  // draw the bars
  drawValues();



  /* tooltip for displaying data on each item */
  var floating_tooltip = floatingTooltip('floatingTooltip', "215px");

  function showFloatingTooltip(d) {

    var y = d3.scaleLinear().rangeRound([graphHeight, 0]).domain([0, 4500]);
    var h = y(d.total / 1e6);

    // outline the bar for that year
    graph.append('rect')
      .attr('class', 'outline')
      .attr('x', x(d.name))
      .attr('y', h)
      .attr('width', x.bandwidth())
      .attr('height', graphHeight - h)
      .attr('fill', 'none')
      .attr('stroke', 'black')
      .attr('stroke-width', 2);

    var content = '<span class="heading"><p style="text-align: center">' + d.name + '</p></span>' +
                  '<table><tr><td style="padding: 0px 10px 0px 20px">Principal: </td><td style="text-align: center">' + formatAmount(d.principal) + '</td></tr>' +
                  '<tr><td style="padding: 0px 10px 0px 20px">Interest: </td><td style="text-align: center">' + formatAmount(d.interest) + '</td></tr>' + 
                  '<tr><td style="padding: 0px 10px 0px 20px">Total: </td><td style="text-align: center">' + formatAmount(d.total) + '</td></tr></table>';
    // display tooltip
    floating_tooltip.revealTooltip(content, d3.event);
  }

  // wrap x-axis labels
  d3.select('.axis--x').selectAll(".tick text")
    .call(wrap, 100);

}

d3.csv("outstanding_debt.csv", function(d) {
  d.name = d.Name;
  d.principal = d.Principal * 1000;
  d.interest = d.Interest * 1000;
  d.total = d.Total * 1000;
  return d;
}, plotData);
