import * as d3 from "d3";

async function getDataset() {
  return await d3.json("./my_weather_data.json");
}
async function drawLineChart() {
  const yAccessor = d => (d.temperatureMax - 32) * (5 / 9);
  const dateParser = d3.timeParse("%Y-%m-%d");
  const xAccessor = d => dateParser(d.date);
  const dataset = await getDataset();
  const dimensions = {
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

  const wrapper = d3
    .select("#wrapper")
    .append("svg")
    .attr("width", dimensions.width)
    .attr("height", dimensions.height);
  const bounds = wrapper
    .append("g")
    .style(
      "transform",
      `translate(${dimensions.margin.left}px,${dimensions.margin.top}px)`
    );
  const yScale = d3
    .scaleLinear()
    .domain(d3.extent(dataset, yAccessor))
    .range([dimensions.boundedHeight, 0]);
  const fTemperatureDay = yScale(0);
  const fTemperatures = bounds
    .append("rect")
    .attr("x", 0)
    .attr("width", dimensions.boundedWidth)
    .attr("y", fTemperatureDay)
    .attr("height", dimensions.boundedHeight - fTemperatureDay)
    .attr("fill", "#e0f3f1");
  const xScale = d3
    .scaleTime()
    .domain(d3.extent(dataset, xAccessor))
    .range([0, dimensions.boundedWidth]);
  const lineGenerator = d3
    .line()
    .x(d => xScale(xAccessor(d)))
    .y(d => yScale(yAccessor(d)));
  const line = bounds
    .append("path")
    .attr("d", lineGenerator(dataset))
    .attr("fill", "none")
    .attr("stroke", "#af8369")
    .attr("stroke-width", 2);
  const yAxisGenerator = d3.axisLeft().scale(yScale);
  const xAxisgenerator = d3.axisBottom().scale(xScale);
  const yAxis = bounds.append("g").call(yAxisGenerator);
  const xAxis = bounds
    .append("g")
    .call(xAxisgenerator)
    .style("transform", `translateY(${dimensions.boundedHeight}px)`);
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
    .attr("x", -dimensions.boundedHeight / 2)
    .attr("y", -dimensions.margin.left + 10)
    .attr("fill", "black")
    .style("font-size", "1.4em")
    .text("Relative humidity")
    .style("transform", "rotate(-90deg)")
    .style("text-anchor", "middle");
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
    .attr("class", "x-axis-label");

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

    let binGroups = bounds
      .select(".bins")
      .selectAll(".bin")
      .data(bins);

    binGroups.exit().remove();

    const newBinGroups = binGroups
      .enter()
      .append("g")
      .attr("class", "bin");

    newBinGroups.append("rect");
    newBinGroups.append("text");

    // update binGroups to include new points
    binGroups = newBinGroups.merge(binGroups);

    const barRects = binGroups
      .select("rect")
      .attr("x", d => xScale(d.x0) + barPadding)
      .attr("y", d => yScale(yAccessor(d)))
      .attr("width", d => d3.max([0, xScale(d.x1) - xScale(d.x0) - barPadding]))
      .attr("height", d => dimensions.boundedHeight - yScale(yAccessor(d)));

    const barText = binGroups
      .select("text")
      .attr("x", d => xScale(d.x0) + (xScale(d.x1) - xScale(d.x0)) / 2)
      .attr("y", 0)
      .style("transform", d => `translateY(${yScale(yAccessor(d)) - 5}px)`)
      .text(d => yAccessor(d) || "");

    const mean = d3.mean(dataset, metricAccessor);

    const meanLine = bounds
      .selectAll(".mean")

      .attr("y1", -20)
      .attr("y2", dimensions.boundedHeight)
      .style("transform", `translateX(${xScale(mean)}px)`);

    // 6. Draw peripherals

    const xAxisGenerator = d3.axisBottom().scale(xScale);

    const xAxis = bounds.select(".x-axis").call(xAxisGenerator);

    const xAxisLabel = xAxis
      .select(".x-axis-label")
      .attr("x", dimensions.boundedWidth / 2)
      .attr("y", dimensions.margin.bottom - 10)
      .text(metric);
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
drawAnimBars();
// drawHistogram();
// drawScatterplot();
// drawLineChart();
//metrics.forEach(drawHistgrams);
