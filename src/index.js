import * as d3 from "d3";
import { Delaunay } from "d3-delaunay";

async function getDataset() {
  return await d3.json("./my_weather_data.json");
}
async function drawLineChart() {
  let dataset = await getDataset();
  const yAccessor = d => (d.temperatureMax - 32) * (5 / 9);
  const dateParser = d3.timeParse("%Y-%m-%d");
  const xAccessor = d => dateParser(d.date);
  dataset = dataset.sort((a, b) => xAccessor(a) - xAccessor(b)).slice(0, 100);

  let dimensions = {
    width: window.innerWidth * 0.9,
    height: 400,
    margin: {
      top: 15,
      right: 15,
      bottom: 40,
      left: 60
    }
  };
  dimensions.boundedWidth =
    dimensions.width - dimensions.margin.left - dimensions.margin.right;
  dimensions.boundedHeight =
    dimensions.height - dimensions.margin.top - dimensions.margin.bottom;

  // 3. Draw canvas

  const wrapper = d3
    .select("#wrapper")
    .append("svg")
    .attr("width", dimensions.width)
    .attr("height", dimensions.height);

  const bounds = wrapper
    .append("g")
    .style(
      "transform",
      `translate(${dimensions.margin.left}px, ${dimensions.margin.top}px)`
    );
  bounds.append("g").attr("class", "y-axis");
  bounds
    .append("defs")
    .append("clipPath")
    .attr("id", "bounds-clip-path")
    .append("rect")
    .attr("width", dimensions.boundedHeight)
    .attr("height", dimensions.boundedHeight);
  bounds.append("rect").attr("class", "freezing");
  const clip = bounds.append("g").attr("clip-path", "url(#bounds-clip-path");
  clip.append("path").attr("class", "line");

  bounds.append("rect").attr("class", "freezing");
  bounds.append("path").attr("class", "line");
  bounds
    .append("g")
    .attr("class", "x-axis")
    .style("transform", `translateY(${dimensions.boundedHeight}px)`);

  const drawLine = dataset => {
    const yScale = d3
      .scaleLinear()
      .domain(d3.extent(dataset, yAccessor))
      .range([dimensions.boundedHeight, 0]);

    const freezingTemperaturePlacement = yScale(0);
    const freezingTemperatures = bounds
      .select(".freezing")
      .attr("x", 0)
      .attr("width", dimensions.boundedWidth)
      .attr("y", freezingTemperaturePlacement)
      .attr("height", dimensions.boundedHeight - freezingTemperaturePlacement);

    const xScale = d3
      .scaleTime()
      .domain(d3.extent(dataset, xAccessor))
      .range([0, dimensions.boundedWidth]);

    const lineGenerator = d3
      .line()
      .x(d => xScale(xAccessor(d)))
      .y(d => yScale(yAccessor(d)));
    const lastTowPoints = dataset.slice(-2);
    const pixelsBetweenLastPoints =
      xScale(xAccessor(lastTowPoints[1])) - xScale(xAccessor(lastTowPoints[0]));
    const line = bounds
      .select(".line")
      .attr("d", lineGenerator(dataset))
      .style("transform", `translateX(${pixelsBetweenLastPoints}px)`)
      .transition()
      .duration(600)
      .style("transform", "none")
      .attr("d", lineGenerator(dataset));

    const yAxisGenerator = d3.axisLeft().scale(yScale);

    const yAxis = bounds
      .select(".y-axis")
      .transition()
      .duration(600)
      .call(yAxisGenerator);

    const xAxisGenerator = d3.axisBottom().scale(xScale);

    const xAxis = bounds.select(".x-axis").call(xAxisGenerator);

    const listeninRect = bounds
      .append("rect")
      .attr("class", "listening-rect")
      .attr("width", dimensions.boundedWidth)
      .attr("height", dimensions.boundedHeight)
      .on("mousemove", onMouseMove)
      .on("mouseleave", onMouseLeave);

    const tooltip = d3.select("#tooltip");
    const tooltipCircle = bounds
      .append("circle")
      .attr("r", 4)
      .attr("stroke", "#af9350")
      .attr("fill", "white")
      .attr("stroke-width", 2)
      .style("opacity", 0);
    function onMouseMove() {
      const mousePosition = d3.mouse(this);
      const hoverdDate = xScale.invert(mousePosition[0]);
      const getDistanceFromHoveredDate = d =>
        Math.abs(xAccessor(d) - hoverdDate);
      const closestIndex = d3.scan(
        dataset,
        (a, b) => getDistanceFromHoveredDate(a) - getDistanceFromHoveredDate(b)
      );
      const closestDataPoint = dataset[closestIndex];
      const closestXValue = xAccessor(closestDataPoint);
      const closestYValue = yAccessor(closestDataPoint);
      const formaTemperture = d => `${d3.format(".1f")(d)}F`;
      const formatDate = d3.timeFormat("%B %A %-d, %Y");
      tooltip.select("#date").text(formatDate(closestXValue));

      tooltip.select("#temperature").text(formaTemperture(closestYValue));
      const x = xScale(closestXValue) + dimensions.margin.left;
      const y = yScale(closestYValue) + dimensions.margin.top;
      tooltip.style(
        "transform",
        `translate(` + `calc( -50% + ${x}px),` + `calc( -100% + ${y}px)` + `)`
      );
      tooltipCircle
        .attr("cx", xScale(closestXValue))
        .attr("cy", yScale(closestYValue))
        .style("opacity", 1);
      tooltip.style("opacity", 1);
    }
    function onMouseLeave() {
      tooltip.style("opacity", 0);
      tooltipCircle.style("opacity", 0);
    }
  };
  drawLine(dataset);

  setInterval(addNewDay, 1500);
  function addNewDay() {
    dataset = [...dataset.slice(1), generateNewDataPoint(dataset)];
    drawLine(dataset);
  }

  function generateNewDataPoint(dataset) {
    const lastDataPoint = dataset[dataset.length - 1];
    const nextDay = d3.timeDay.offset(xAccessor(lastDataPoint), 1);

    return {
      date: d3.timeFormat("%Y-%m-%d")(nextDay),
      temperatureMax: yAccessor(lastDataPoint) + (Math.random() * 6 - 3)
    };
  }
}

async function drawScatterplot() {
  const dataset = await await getDataset();
  const xAccessor = d => (d.dewPoint - 32) * (5 / 9);
  const yAccessor = d => d.humidity;
  const colorAccessor = d => d.cloudCover;
  const width = d3.min([window.innerWidth * 0.9, window.innerHeight * 0.9]);
  let dimensions = {
    width: width,
    height: width,
    margin: {
      top: 15,
      rigth: 15,
      bottom: 50,
      left: 50
    }
  };

  dimensions.boundedWidth =
    dimensions.width - dimensions.margin.left - dimensions.margin.rigth;
  dimensions.boundedHeight =
    dimensions.height - dimensions.margin.top - dimensions.margin.bottom;
  const wrapper = d3
    .select("#scatterplot")
    .append("svg")
    .attr("width", dimensions.width)
    .attr("height", dimensions.height);
  const bounds = wrapper
    .append("g")
    .style(
      "transform",
      `translate(${dimensions.margin.left}px,${dimensions.margin.top}px)`
    );
  const xScale = d3
    .scaleLinear()
    .domain(d3.extent(dataset, xAccessor))
    .range([0, dimensions.boundedWidth])
    .nice();
  const yScale = d3
    .scaleLinear()
    .domain(d3.extent(dataset, yAccessor))
    .range([dimensions.boundedHeight, 0])
    .nice();
  const delaunay = Delaunay.from(
    dataset,
    d => xScale(xAccessor(d)),
    d => yScale(yAccessor(d))
  );
  const voronoi = delaunay.voronoi();
  voronoi.xmax = dimensions.boundedWidth;
  voronoi.ymax = dimensions.boundedHeight;
  bounds
    .selectAll(".voronoi")
    .data(dataset)
    .enter()
    .append("path")
    .attr("class", "voronoi")
    .attr("d", (d, i) => voronoi.renderCell(i))
    .on("mouseenter", onMouseEnter)
    .on("mouseleave", onMouseLeave);

  const colorScale = d3
    .scaleLinear()
    .domain(d3.extent(dataset, colorAccessor))
    .range(["skyblue", "darkslategrey"]);
  const dots = bounds
    .selectAll("circle")
    .data(dataset)
    .enter()
    .append("circle")
    .attr("cx", d => xScale(xAccessor(d)))
    .attr("cy", d => yScale(yAccessor(d)))
    .attr("r", 3)
    .attr("fill", d => colorScale(colorAccessor(d)));
  const xAxisGenerator = d3.axisBottom().scale(xScale);

  const xAxis = bounds
    .append("g")
    .call(xAxisGenerator)
    .style("transform", `translateY(${dimensions.boundedHeight}px)`);
  const xAisLabel = xAxis
    .append("text")
    .attr("class", "x-zxis-label")
    .attr("x", dimensions.boundedWidth / 2)
    .attr("y", dimensions.margin.bottom - 10)
    .attr("fill", "black")
    .style("font-size", "1.4em")
    .html("Dew point (&#8451)");
  const yAxisGenerator = d3
    .axisLeft()
    .scale(yScale)
    .ticks(4);

  const yAxis = bounds.append("g").call(yAxisGenerator);

  const yAxisLabel = yAxis
    .append("text")
    .attr("class", "y-axis-label")
    .attr("x", -dimensions.boundedHeight / 2)
    .attr("y", -dimensions.margin.left + 10)
    .attr("fill", "black")
    .style("font-size", "1.4em")
    .text("Relative humidity")
    .style("transform", "rotate(-90deg)")
    .style("text-anchor", "middle");
  bounds.selectAll("circle");

  const tooltip = d3.select("#tooltipscatterplot");
  function onMouseEnter(datum, index) {
    const formatHumidity = d3.format(".2f");
    tooltip.select("#humidity").text(formatHumidity(yAccessor(datum)));
    const formatDewPoint = d3.format(".2f");
    tooltip.select("#dew-point").text(formatDewPoint(xAccessor(datum)));
    const dateParser = d3.timeParse("%Y-%m-%d");
    const formatDate = d3.timeFormat("%B %A %-d,%Y");
    tooltip.select("#date").text(formatDate(dateParser(datum.date)));
    const x = xScale(xAccessor(datum)) + dimensions.margin.left;
    const y = yScale(yAccessor(datum)) + dimensions.margin.top;
    tooltip.style(
      "transform",
      `translate(` + `calc( -50% + ${x}px),` + `calc(-100% + ${y}px)` + `)`
    );
    tooltip.style("opacity", 1);
    const dayDot = bounds
      .append("circle")
      .attr("class", "tooltipDot")
      .attr("cx", xScale(xAccessor(datum)))
      .attr("cy", yScale(yAccessor(datum)))
      .attr("r", 7)
      .attr("fill", "maroon")
      .style("pointer-events", "none");
  }
  function onMouseLeave() {
    tooltip.style("opacity", 0);
    d3.selectAll(".tooltipDot").remove();
  }
}
async function drawHistogram() {
  const dataset = await getDataset();
  const metricAccessor = d => d.humidity;
  const yAccessor = d => d.length;
  const width = 600;
  let dimensions = {
    width: width,
    height: width * 0.6,
    margin: {
      top: 30,
      right: 10,
      bottom: 50,
      left: 50
    }
  };
  dimensions.boundedWidth =
    dimensions.width - dimensions.margin.left - dimensions.margin.right;
  dimensions.boundedHeight =
    dimensions.height - dimensions.margin.top - dimensions.margin.bottom;
  const wrapper = d3
    .select("#histogram")
    .append("svg")
    .attr("width", dimensions.width)
    .attr("height", dimensions.height);
  const bounds = wrapper
    .append("g")
    .style(
      "transform",
      `translate(${dimensions.margin.left}px,${dimensions.margin.top}px)`
    );
  const xScale = d3
    .scaleLinear()
    .domain(d3.extent(dataset, metricAccessor))
    .range([0, dimensions.boundedWidth])
    .nice();
  const binsGenerator = d3
    .histogram()
    .domain(xScale.domain())
    .value(metricAccessor)
    .thresholds(12);
  const bins = binsGenerator(dataset);
  const yScale = d3
    .scaleLinear()
    .domain([0, d3.max(bins, yAccessor)])
    .range([dimensions.boundedHeight, 0])
    .nice();
  const binsGroup = bounds.append("g");
  const binGroups = binsGroup
    .selectAll("g")
    .data(bins)
    .enter()
    .append("g");
  const barPadding = 1;
  const barRects = binGroups
    .append("rect")
    .attr("x", d => xScale(d.x0) + barPadding / 2)
    .attr("y", d => yScale(yAccessor(d)))
    .attr("width", d => d3.max([0, xScale(d.x1) - xScale(d.x0) - barPadding]))
    .attr("height", d => dimensions.boundedHeight - yScale(yAccessor(d)))
    .attr("fill", "cornflowerblue");
  const barText = binGroups
    .filter(yAccessor)
    .append("text")
    .attr("x", d => xScale(d.x0) + (xScale(d.x1) - xScale(d.x0)) / 2)
    .attr("y", d => yScale(yAccessor(d)) - 5)
    .text(yAccessor)
    .style("text-anchor", "middle")
    .attr("fill", "darkgrey")
    .attr("font-size", "12px")
    .attr("font-family", "sans-serif");
  const mean = d3.mean(dataset, metricAccessor);
  const meanLine = bounds
    .append("line")
    .attr("x1", xScale(mean))
    .attr("x2", xScale(mean))
    .attr("y1", -15)
    .attr("y2", dimensions.boundedHeight)
    .attr("stroke", "maroon")
    .attr("stroke-dasharray", "2px 4px");
  const meanLabel = bounds
    .append("text")
    .attr("x", xScale(mean))
    .attr("y", -20)
    .text("mean")
    .attr("fill", "maroon")
    .style("font-size", "12px")
    .attr("text-anchor", "middle");
  const xAxisGenerator = d3.axisBottom().scale(xScale);
  const xAxis = bounds
    .append("g")
    .call(xAxisGenerator)
    .style("transform", `translateY(${dimensions.boundedHeight}px)`);
  const xAxisLabel = xAxis
    .append("text")
    .attr("x", dimensions.boundedWidth / 2)
    .attr("y", dimensions.margin.bottom - 10)
    .attr("fill", "black")
    .style("font-size", "1.4em")
    .text("Humidity");
  binGroups
    .select("rect")
    .on("mouseenter", onMouseEnter)
    .on("mouseleave", onMouseLeave);
  const tooltip = d3.select("#tooltip");
  const formatHumidity = d3.format(".2f");
  function onMouseEnter(datum) {
    tooltip.select("#count").text(yAccessor(datum));
    tooltip
      .select("#range")
      .text([formatHumidity(datum.x0), formatHumidity(datum.x1)].join(" - "));
    const x =
      xScale(datum.x0) +
      (xScale(datum.x1) - xScale(datum.x0)) / 2 +
      dimensions.margin.left;
    const y = yScale(yAccessor(datum)) + dimensions.margin.top;
    tooltip.style(
      "transform",
      `translate(` + `calc( -50% + ${x}px),` + `calc(-100% + ${y}px)` + `)`
    );
    tooltip.style("opacity", 1);
  }
  function onMouseLeave(datum) {
    tooltip.style("opacity", 0);
  }
}

async function drawHistgrams(metric) {
  const dataset = await getDataset();
  const metricAccessor = d => d[metric];
  const yAccessor = d => d.length;
  const width = 600;
  let dimensions = {
    width: width,
    height: width * 0.6,
    margin: {
      top: 30,
      right: 10,
      bottom: 50,
      left: 50
    }
  };
  dimensions.boundedWidth =
    dimensions.width - dimensions.margin.left - dimensions.margin.right;
  dimensions.boundedHeight =
    dimensions.height - dimensions.margin.top - dimensions.margin.bottom;
  const wrapper = d3
    .select("#histogram")
    .append("svg")
    .attr("width", dimensions.width)
    .attr("height", dimensions.height);
  const bounds = wrapper
    .append("g")
    .style(
      "transform",
      `translate(${dimensions.margin.left}px,${dimensions.margin.top}px)`
    );
  const xScale = d3
    .scaleLinear()
    .domain(d3.extent(dataset, metricAccessor))
    .range([0, dimensions.boundedWidth])
    .nice();
  const binsGenerator = d3
    .histogram()
    .domain(xScale.domain())
    .value(metricAccessor)
    .thresholds(12);
  const bins = binsGenerator(dataset);
  const yScale = d3
    .scaleLinear()
    .domain([0, d3.max(bins, yAccessor)])
    .range([dimensions.boundedHeight, 0])
    .nice();
  const binsGroup = bounds
    .append("g")
    .attr("tabindex", "0")
    .attr("role", "list")
    .attr("aria-label", "histogram bars");
  const binGroups = binsGroup
    .selectAll("g")
    .data(bins)
    .enter()
    .append("g")
    .attr("tabindex", "0")
    .attr("role", "listitem")
    .attr(
      "aria-label",
      d =>
        `There were ${yAccessor(d)} days between ${d.x0
          .toString()
          .slice(0, 4)} and ${d.x1.toString().slice(0, 4)} ${metric} levels.`
    );
  const barPadding = 1;
  const barRects = binGroups
    .append("rect")
    .attr("x", d => xScale(d.x0) + barPadding / 2)
    .attr("y", d => yScale(yAccessor(d)))
    .attr("width", d => d3.max([0, xScale(d.x1) - xScale(d.x0) - barPadding]))
    .attr("height", d => dimensions.boundedHeight - yScale(yAccessor(d)))
    .attr("fill", "cornflowerblue");
  const barText = binGroups
    .filter(yAccessor)
    .append("text")
    .attr("x", d => xScale(d.x0) + (xScale(d.x1) - xScale(d.x0)) / 2)
    .attr("y", d => yScale(yAccessor(d)) - 5)
    .text(yAccessor)
    .style("text-anchor", "middle")
    .attr("fill", "darkgrey")
    .attr("font-size", "12px")
    .attr("font-family", "sans-serif");
  const mean = d3.mean(dataset, metricAccessor);
  const meanLine = bounds
    .append("line")
    .attr("x1", xScale(mean))
    .attr("x2", xScale(mean))
    .attr("y1", -15)
    .attr("y2", dimensions.boundedHeight)
    .attr("stroke", "maroon")
    .attr("stroke-dasharray", "2px 4px");
  const meanLabel = bounds
    .append("text")
    .attr("x", xScale(mean))
    .attr("y", -20)
    .text("mean")
    .attr("fill", "maroon")
    .style("font-size", "12px")
    .attr("text-anchor", "middle");
  const xAxisGenerator = d3.axisBottom().scale(xScale);
  const xAxis = bounds
    .append("g")
    .call(xAxisGenerator)
    .style("transform", `translateY(${dimensions.boundedHeight}px)`);
  const xAxisLabel = xAxis
    .append("text")
    .attr("x", dimensions.boundedWidth / 2)
    .attr("y", dimensions.margin.bottom - 10)
    .attr("fill", "black")
    .style("font-size", "1.4em")
    .text(metric)
    .style("text-trasform", "capitalize");
  wrapper
    .attr("role", "figure")
    .attr("tabindex", "0")
    .append("title")
    .text(`Histogram looking at the distribution of ${metric}`);
  wrapper
    .selectAll("text")
    .attr("role", "presentation")
    .attr("aria-hidden", "true");
}
async function drawAnimBars() {
  const dataset = await getDataset();
  const width = 500;
  let dimensions = {
    width: width,
    height: width * 0.6,
    margin: {
      top: 30,
      right: 10,
      bottom: 50,
      left: 50
    }
  };
  dimensions.boundedWidth =
    dimensions.width - dimensions.margin.left - dimensions.margin.right;
  dimensions.boundedHeight =
    dimensions.height - dimensions.margin.top - dimensions.margin.bottom;

  // 3. Draw canvas

  const wrapper = d3
    .select("#wrapper")
    .append("svg")
    .attr("width", dimensions.width)
    .attr("height", dimensions.height);

  const bounds = wrapper
    .append("g")
    .style(
      "transform",
      `translate(${dimensions.margin.left}px, ${dimensions.margin.top}px)`
    );

  // init static elements
  bounds.append("g").attr("class", "bins");
  bounds.append("line").attr("class", "mean");
  bounds
    .append("g")
    .attr("class", "x-axis")
    .style("transform", `translateY(${dimensions.boundedHeight}px)`)
    .append("text")
    .attr("class", "x-axis-label")
    .attr("x", dimensions.boundedWidth / 2)
    .attr("y", dimensions.margin.bottom - 10);

  const drawHistogram = metric => {
    const metricAccessor = d => d[metric];
    const yAccessor = d => d.length;

    // 4. Create scales

    const xScale = d3
      .scaleLinear()
      .domain(d3.extent(dataset, metricAccessor))
      .range([0, dimensions.boundedWidth])
      .nice();

    const binsGenerator = d3
      .histogram()
      .domain(xScale.domain())
      .value(metricAccessor)
      .thresholds(12);

    const bins = binsGenerator(dataset);

    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(bins, yAccessor)])
      .range([dimensions.boundedHeight, 0])
      .nice();

    // 5. Draw data

    const barPadding = 1;

    const exitTransition = d3.transition().duration(600);
    const updateTransition = exitTransition.transition().duration(600);
    let binGroups = bounds
      .select(".bins")
      .selectAll(".bin")
      .data(bins);

    const oldBinGroups = binGroups.exit();
    oldBinGroups
      .selectAll("rect")
      .style("fill", "red")
      .transition(exitTransition)
      .attr("y", dimensions.boundedHeight)
      .attr("height", 0);
    oldBinGroups
      .selectAll("text")
      .transition(exitTransition)
      .attr("y", dimensions.boundedHeight);
    oldBinGroups.transition(exitTransition).remove();

    const newBinGroups = binGroups
      .enter()
      .append("g")
      .attr("class", "bin");

    newBinGroups
      .append("rect")
      .attr("height", 0)
      .attr("x", d => xScale(d.x0) + barPadding)
      .attr("y", dimensions.boundedHeight)
      .attr("width", d => d3.max([0, xScale(d.x1) - xScale(d.x0) - barPadding]))
      .style("fill", "yellowgreen");
    newBinGroups
      .append("text")
      .attr("x", d => xScale(d.x0) + (xScale(d.x1) - xScale(d.x0)) / 2)
      .attr("y", dimensions.boundedHeight);

    // update binGroups to include new points
    binGroups = newBinGroups.merge(binGroups);

    const barRects = binGroups
      .select("rect")
      .transition(updateTransition)

      .attr("x", d => xScale(d.x0) + barPadding)
      .attr("y", d => yScale(yAccessor(d)))
      .attr("height", d => dimensions.boundedHeight - yScale(yAccessor(d)))
      .attr("width", d => d3.max([0, xScale(d.x1) - xScale(d.x0) - barPadding]))
      .transition()
      .style("fill", "cornflowerblue");

    const barText = binGroups
      .select("text")
      .transition(updateTransition)

      .attr("x", d => xScale(d.x0) + (xScale(d.x1) - xScale(d.x0)) / 2)
      .attr("y", d => yScale(yAccessor(d)) - 5)
      .text(d => yAccessor(d) || "");

    const mean = d3.mean(dataset, metricAccessor);

    const meanLine = bounds
      .selectAll(".mean")
      .transition(updateTransition)
      .attr("x1", xScale(mean))
      .attr("x2", xScale(mean))
      .attr("y1", -20)
      .attr("y2", dimensions.boundedHeight);

    // 6. Draw peripherals

    const xAxisGenerator = d3.axisBottom().scale(xScale);

    const xAxis = bounds
      .select(".x-axis")
      .transition(updateTransition)
      .call(xAxisGenerator);

    const xAxisLabel = xAxis.select(".x-axis-label").text(metric);
  };

  const metrics = [
    "windSpeed",
    "moonPhase",
    "dewPoint",
    "humidity",
    "uvIndex",
    "windBearing",
    "temperatureMin",
    "temperatureMax"
  ];
  let selectedMetricIndex = 0;
  drawHistogram(metrics[selectedMetricIndex]);

  const button = d3
    .select("body")
    .append("button")
    .text("Change metric");

  button.node().addEventListener("click", onClick);
  function onClick() {
    selectedMetricIndex = (selectedMetricIndex + 1) % (metrics.length - 1);
    drawHistogram(metrics[selectedMetricIndex]);
  }
}
const metrics = [
  "windSpeed",
  "moonPhase",
  "dewPoint",
  "humidity",
  "uvIndex",
  "windBearing",
  "temperatureMin",
  "temperatureMax"
];
async function createEvent() {
  const rectColors = ["yellowgreen", "cornflowerblue", "seagreen", "slateblue"];

  const rects = d3
    .select("#colorRects")
    .selectAll(".rect")
    .data(rectColors)
    .enter()
    .append("rect")
    .attr("height", 100)
    .attr("width", 100)
    .attr("x", (d, i) => i * 110)
    .attr("fill", "lightgrey");
  rects
    .on("mouseenter", function(datum, index, nodes) {
      d3.select(this).style("fill", datum);
    })
    .on("mouseout", function() {
      d3.select(this).style("fill", "lightgray");
    });
  setTimeout(() => {
    rects
      .dispatch("mouseout")
      .on("mouseenter", null)
      .on("mouseout", null);
  }, 3000);
}
async function drawMap() {
  const countryShapes = await d3.json("./world-geojson.json");
  const dataset = await d3.csv("./data_population.csv");
  const metric = "Population growth (annual %)";
  const countryNameAccessor = d => d.properties["NAME_RU"];
  const countryIdAccessor = d => d.properties["ADM0_A3_IS"];

  let metricDataByCountry = {};
  dataset.forEach(d => {
    if (d["Series Name"] != metric) return;
    metricDataByCountry[d["Country Code"]] = +d["2018 [YR2018]"] || 0;
  });
  let dimensions = {
    width: window.innerWidth * 0.9,
    margin: {
      top: 10,
      right: 10,
      bottom: 10,
      left: 10
    }
  };
  dimensions.boundedWidth =
    dimensions.width - dimensions.margin.left - dimensions.margin.right;
  const sphere = { type: "Sphere" };
  const projection = d3
    .geoEqualEarth()
    .fitWidth(dimensions.boundedWidth, sphere);
  const pathGenerator = d3.geoPath(projection);
  const [[x0, y0], [x1, y1]] = pathGenerator.bounds(sphere);
  dimensions.boundedHeight = y1;
  dimensions.height =
    dimensions.boundedHeight + dimensions.margin.top + dimensions.margin.bottom;
  const wrapper = d3
    .select("#map")
    .append("svg")
    .attr("width", dimensions.width)
    .attr("height", dimensions.height);
  const bounds = wrapper
    .append("g")
    .style(
      "transform",
      `translate(${dimensions.margin.left}px,${dimensions.margin.top}px`
    );
  const metricValues = Object.values(metricDataByCountry);
  const metricValueExtent = d3.extent(metricValues);
  const maxChange = d3.max([-metricValueExtent[0], metricValueExtent[1]]);
  const colorScale = d3
    .scaleLinear()
    .domain([-maxChange, 0, maxChange])
    .range(["indigo", "white", "darkgreen"]);
  const earth = bounds
    .append("path")
    .attr("class", "earth")
    .attr("d", pathGenerator(sphere));
  const graticuleJson = d3.geoGraticule10();
  const graticule = bounds
    .append("path")
    .attr("class", "graticule")
    .attr("d", pathGenerator(graticuleJson));
  const countries = bounds
    .selectAll(".country")
    .data(countryShapes.features)
    .enter()
    .append("path")
    .attr("class", "country")
    .attr("d", pathGenerator)
    .attr("fill", d => {
      const metricValue = metricDataByCountry[countryIdAccessor(d)];
      if (typeof metricValue == "undefined") return "#fff";
      return colorScale(metricValue);
    });
  const legendGroup = wrapper
    .append("g")
    .attr(
      "transform",
      `translate(${120},${
        dimensions.width < 800
          ? dimensions.boundedHeight - 10
          : dimensions.boundedHeight * 0.5
      })`
    );
  const legendTitle = legendGroup
    .append("text")
    .attr("y", -23)
    .attr("class", "legend-title")
    .text("Population growth");
  const legendByLine = legendGroup
    .append("text")
    .attr("y", -9)
    .attr("class", "legend-byline")
    .text("Precent change in 2018");
  const defs = wrapper.append("defs");
  const legendGradientId = "legend-gradient";
  const gradient = defs
    .append("linearGradient")
    .attr("id", legendGradientId)
    .selectAll("stop")
    .data(colorScale.range())
    .enter()
    .append("stop")
    .attr("stop-color", d => d)
    .attr("offset", (d, i) => `${(i * 100) / 2}%`);
  const legendWidht = 120;
  const legendHeight = 16;
  const legendGradient = legendGroup
    .append("rect")
    .attr("x", -legendWidht / 2)
    .attr("height", legendHeight)
    .attr("width", legendWidht)
    .style("fill", `url(#${legendGradientId})`);
  const legendValueRight = legendGroup
    .append("text")
    .attr("class", "legend-value")
    .attr("x", legendWidht / 2 + 10)
    .attr("y", legendHeight / 2)
    .text(`${d3.format(".1f")(maxChange)}%`);
  const legendValueLeft = legendGroup
    .append("text")
    .attr("class", "legend-value")
    .attr("x", -legendWidht / 2 - 10)
    .attr("y", legendHeight / 2)
    .text(`${d3.format(".1f")(-maxChange)}%`)
    .style("text-anchor", "end");
  navigator.geolocation.getCurrentPosition(position => {
    const [x, y] = projection([
      position.coords.longitude,
      position.coords.latitude
    ]);
    const myLocation = bounds
      .append("circle")
      .attr("class", "my-location")
      .attr("cx", x)
      .attr("cy", y)
      .attr("r", 0)
      .transition()
      .duration(500)
      .attr("r", 10);
  });
  countries.on("mouseenter", onMouseEnter).on("mouseleave", onMouseLeave);
  const tooltip = d3.select("#tooltip");
  function onMouseEnter(datum) {
    tooltip.style("opacity", 1);
    const metricValue = metricDataByCountry[countryIdAccessor(datum)];
    tooltip.select("#country").text(countryNameAccessor(datum));
    tooltip.select("#value").text(`${d3.format(",.2f")(metricValue || 0)}%`);
    const [centerX, centerY] = pathGenerator.centroid(datum);
    const x = centerX + dimensions.margin.left;
    const y = centerY + dimensions.margin.top;
    tooltip.style(
      "transform",
      `translate(` + `calc( -50% + ${x}px),` + `calc(-100% + ${y}px)` + `)`
    );
  }
  function onMouseLeave() {
    tooltip.style("opacity", 0);
  }
}
drawMap();
//createEvent();
//drawAnimBars();
//drawHistogram();
//drawScatterplot();
//drawLineChart();
//metrics.forEach(drawHistgrams);
