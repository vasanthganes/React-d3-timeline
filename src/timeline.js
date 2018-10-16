import React, { Component } from "react";
import ReactDOM from "react-dom";
import * as d3 from "d3";
import moment from "moment";

class TimeLineComponent extends Component {
  constructor(props) {
    super(props);
    this.createTimeline = this.createTimeline.bind(this);
  }

  createTimeline(transactions = []) {
    let parentWidth = ReactDOM.findDOMNode(this).parentNode.clientWidth || 960;
    let parentHeight = 400;
    let data = [];

    let dates = transactions.map(val => new Date(val.created));

    var items = ["Banking", "Payment"];

    for (let i = 0; i < dates.length; i++) {
      var date = dates[i];

      data.push({
        date:
          date.getDate() +
          "/" +
          (date.getMonth() + 1) +
          "/" +
          date.getFullYear(),
        time:
          date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds(),
        pivot: items[Math.floor(Math.random() * items.length)]
      });
    }

    // *** Parse the date / time
    var parseDate = d3.timeParse("%e/%m/%Y");
    var parseTime = d3.timeParse("%H:%M:%S");

    data.forEach(function(d) {
      d.date = parseDate(d.date);
      d.time = parseTime(d.time);
    });

    // *** Set up svg
    var margin = { top: 20, right: 40, bottom: 60, left: 60 };
    var width = parentWidth - margin.left - margin.right,
      height = parentHeight - margin.top - margin.bottom;

    var tooltip = d3.select(this.refs.tooltip);

    var x = d3
      .scaleTime()
      .range([0, width - margin.left])
      .nice();

    var y = d3.scaleTime().range([height, 0]);

    // *** Scale the range of the data
    var earliestDate = d3.min(data, function(d) {
      return d.date;
    });
    var latestDate = d3.max(data, function(d) {
      return d.date;
    });

    x.domain([earliestDate, latestDate]);
    y.domain([parseTime("00:00:00"), parseTime("23:59:59")]);

    var xAxis = d3
      .axisBottom(x)
      .tickSize(-height)
      .tickFormat(d3.timeFormat("%b %d,%Y"));

    var yAxis = d3
      .axisLeft(y)
      .tickSize(-width)
      .tickFormat(d3.timeFormat("%H:%M:%S"));

    var brush = d3
        .brush()
        .extent([[0, 0], [width, height]])
        .on("end", brushended),
      idleTimeout,
      idleDelay = 350;

    d3.select(this.refs.anchor).html("");

    var svg = d3
      .select(this.refs.anchor)
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var scatter = svg
      .append("g")
      .attr("id", "scatterplot")
      .attr("clip-path", "url(#clip)");

    let colours = { Banking: "#197CB1", Payment: "#58606D" };

    // x axis
    svg
      .append("g")
      .attr("class", "timelineX")
      .attr("id", "axis--x")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis)
      .selectAll("text")
      .style("text-anchor", "end")
      .attr("dx", ".8em")
      .attr("dy", "1em");

    // y axis
    svg
      .append("g")
      .attr("class", "timelineY")
      .attr("id", "axis--y")
      .call(yAxis);

    scatter
      .append("g")
      .attr("class", "brush")
      .call(brush);

    plotData(data);
    function plotData(data) {
      scatter.selectAll(".dot").remove();
      scatter
        .selectAll(".dot")
        .data(data)
        .enter()
        .append("circle")
        .attr("class", "dot")
        .attr("r", 4)
        .attr("cx", function(d) {
          return x(d.date);
        })
        .attr("cy", function(d) {
          return y(d.time);
        })
        .style("fill", function(d) {
          let piv = d.pivot;
          return colours[piv];
        })
        .on("mouseover", function(d) {
          let isLeft = true;
          if (d3.event.pageX + 130 > parentWidth) {
            isLeft = false;
          }

          let date = moment(d.date).format("MMM Do YY");
          let time = moment(d.time).format("hh:mm:ss");

          tooltip
            .transition()
            .duration(200)
            .style("opacity", 2);
          tooltip
            .html(
              `<div>
                <h3>${d.pivot}</h3><p>${date} | ${time}</p>
               </div> `
            )
            .style("top", d3.event.pageY - 28 + "px");

          if (isLeft) {
            tooltip.style("left", d3.event.pageX + "px");
          } else {
            tooltip.style("left", d3.event.pageX - 140 + "px");
          }
        })
        .on("mouseout", function(d) {
          tooltip
            .transition()
            .duration(1100)
            .style("opacity", 0);
        });
    }

    function brushended() {
      var s = d3.event.selection;
      if (!s) {
        if (!idleTimeout) return (idleTimeout = setTimeout(idled, idleDelay));
        x.domain(
          d3.extent(data, function(d) {
            return d.date;
          })
        ).nice();
        y.domain(
          d3.extent(data, function(d) {
            return d.time;
          })
        ).nice();
      } else {
        x.domain([s[0][0], s[1][0]].map(x.invert, x));
        y.domain([s[1][1], s[0][1]].map(y.invert, y));
        scatter.select(".brush").call(brush.move, null);
      }
      zoom();
    }

    function idled() {
      idleTimeout = null;
    }

    function zoom() {
      var t = scatter.transition().duration(750);
      svg
        .select("#axis--x")
        .transition(t)
        .call(xAxis)
        .selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", ".8em")
        .attr("dy", "1em");

      svg
        .select("#axis--y")
        .transition(t)
        .call(yAxis);
      scatter
        .selectAll("circle")
        .transition(t)
        .attr("cx", function(d) {
          return x(d.date);
        })
        .attr("cy", function(d) {
          return y(d.time);
        });
    }
  }

  componentDidMount() {
    let url = "https://api.myjson.com/bins/12aqfs";

    fetch(url, {
      method: "get",
      headers: { "Content-Type": "application/json" }
    })
      .then(response => response.json())
      .then(data => {
        let transactions = data.transactions;
        this.createTimeline(transactions);
      });
  }

  render() {
    return (
      <div className="timeLineGraph">
        <svg ref="anchor" />
        <div ref="tooltip" className="tooltip" />
      </div>
    );
  }
}

export default TimeLineComponent;
