import { html, render } from 'lit-html';
import * as d3 from 'd3';
import {
    dragstarted,
    dragged,
    dragended,
    truncateAddress,
    getNodeColor,
    handleNodeClick
} from './graphUtils';
import { loadAndUpdateGraph } from './loadGraph';
import { Node, Link, GraphData } from './types';
import { PATHS, infoAboutNodes } from './helpers';

const svg: any = d3.select('svg');
const width = window.innerWidth;
const height = window.innerHeight;

let nodes: Node[] = [];
let links: Link[] = [];
let simulation: d3.Simulation<Node, Link>;
let link: d3.Selection<SVGLineElement, Link, SVGGElement, unknown>;
let node: d3.Selection<SVGCircleElement, Node, SVGGElement, unknown>;
let linkLabels: d3.Selection<SVGTextElement, Link, SVGGElement, unknown>;
let labels: d3.Selection<SVGGElement, Node, SVGGElement, unknown>;

function initializeGraph(data: GraphData): void {
    nodes = data.nodes;
    links = data.links;

    links.forEach(function(link) {
        let sourceNode = nodes.find(node => node.address === link.from);
        let targetNode = nodes.find(node => node.address === link.to);
        link.source = sourceNode!;
        link.target = targetNode!;
    });

    svg.attr('width', width).attr('height', height);

    simulation = d3
        .forceSimulation(nodes)
        .force('link', d3.forceLink(links).id(d => (d as any).address).distance(150))
        .force('charge', d3.forceManyBody().strength(-300))
        .force('center', d3.forceCenter(width / 2, height / 2));

    svg
        .append('defs')
        .append('marker')
        .attr('id', 'arrow')
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 35)
        .attr('refY', 0)
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,-5L10,0L0,5')
        .attr('class', 'arrowhead');

    link = svg
        .append('g')
        .attr('class', 'links')
        .selectAll('line')
        .data(links)
        .enter()
        .append('line')
        .attr('class', 'link')
        .attr('marker-end', 'url(#arrow)')
        .style('stroke-dasharray', '3, 3');

    linkLabels = svg
        .append('g')
        .attr('class', 'link-labels')
        .selectAll('text')
        .data(links)
        .enter()
        .append('text')
        .attr('class', 'linktext')
        .attr('dy', '-0.5em')
        .text((d: any) => Math.round(d.balance_delta))
        .style('font-family', 'sans-serif');

    node = svg
        .append('g')
        .attr('class', 'nodes')
        .selectAll('circle')
        .data(nodes)
        .enter()
        .append('circle')
        .attr('r', 15)
        .attr('fill', (d: any) => getNodeColor(d))
        .call(
            d3
                .drag()
                .on('start', (event, d) => dragstarted(event, d, simulation))
                .on('drag', (event, d) => dragged(event, d))
                .on('end', (event, d) => dragended(event, d, simulation))
        );

    labels = svg
        .append('g')
        .attr('class', 'labels')
        .selectAll('g')
        .data(nodes)
        .enter()
        .append('g')
        .attr('class', 'node-labels');

    labels
        .append('text')
        .text(d => d.address_name)
        .attr('text-anchor', 'middle')
        .attr('dy', 35)
        .style('font-size', '12px')
        .style('font-family', 'sans-serif');

    labels
        .append('text')
        .text(d => truncateAddress(d.address))
        .attr('text-anchor', 'middle')
        .attr('dy', d => (d.address_name ? 48 : 30))
        .style('font-size', '11px')
        .style('font-family', 'sans-serif');

    labels
        .append('text')
        .text(d => d.balance.toFixed(1))
        .attr('text-anchor', 'middle')
        .attr('dy', d => (d.address_name ? 60 : 45))
        .style('font-size', '11px')
        .style('font-family', 'sans-serif');

    simulation.on('tick', ticked);

    function ticked(): void {
        if (link && link.data) {
            link
                .attr('x1', d => (d.source ? (d.source as any).x : 0))
                .attr('y1', d => (d.source ? (d.source as any).y : 0))
                .attr('x2', d => (d.target ? (d.target as any).x : 0))
                .attr('y2', d => (d.target ? (d.target as any).y : 0));
        }

        if (node && node.data) {
            node.attr('cx', d => (d.x ? d.x : 0)).attr('cy', d => (d.y ? d.y : 0));
        }

        if (labels && labels.data) {
            labels.attr('transform', d => `translate(${d.x ? d.x : 0},${d.y ? d.y : 0})`);
        }

        if (linkLabels && linkLabels.data) {
            linkLabels
                .attr('x', d => (d.source && d.target ? ((d.source as any).x + (d.target as any).x) / 2 : 0))
                .attr('y', d => (d.source && d.target ? ((d.source as any).y + (d.target as any).y) / 2 : 0));
        }
    }

    node.on('click', (event, d) => handleNodeClick(d, updateGraph));

    renderGraph();
}

function renderGraph() {
    const svgTemplate = html`
        <defs>
            <marker id="arrow" viewBox="0 -5 10 10" refX="35" refY="0" markerWidth="6" markerHeight="6" orient="auto">
                <path d="M0,-5L10,0L0,5" class="arrowhead"></path>
            </marker>
        </defs>
        <g class="links">
            ${links.map((link:any ) => html`
                <line class="link" marker-end="url(#arrow)" style="stroke-dasharray: 3, 3;" x1="${link.source.x}" y1="${link.source.y}" x2="${link.target.x}" y2="${link.target.y}"></line>
            `)}
        </g>
        <g class="link-labels">
            ${links.map((link:any ) => html`
                <text class="linktext" dy="-0.5em" x="${(link.source.x + link.target.x) / 2}" y="${(link.source.y + link.target.y) / 2}">${Math.round(link.balance_delta)}</text>
            `)}
        </g>
        <g class="nodes">
            ${nodes.map(node => html`
                <circle cx="${node.x}" cy="${node.y}" r="15" fill="${getNodeColor(node)}"></circle>
            `)}
        </g>
        <g class="node-labels">
            ${nodes.map(node => html`
                <text text-anchor="middle" dy="35" style="font-size: 12px; font-family: sans-serif;">${node.address_name}</text>
                <text text-anchor="middle" dy="${node.address_name ? 48 : 30}" style="font-size: 11px; font-family: sans-serif;">${truncateAddress(node.address)}</text>
                <text text-anchor="middle" dy="${node.address_name ? 60 : 45}" style="font-size: 11px; font-family: sans-serif;">${node.balance.toFixed(1)}</text>
            `)}
        </g>
    `;
    render(svgTemplate, svg.node()!);
}

function updateGraph(newData: GraphData): void {
    newData.nodes.forEach(function(newNode) {
        let existingNode = nodes.find(node => node.address === newNode.address);
        if (!existingNode) {
            nodes.push(newNode);
        }
    });

    links = links.concat(newData.links);

    links.forEach(function(link) {
        let sourceNode = nodes.find(node => node.address === link.from);
        let targetNode = nodes.find(node => node.address === link.to);
        link.source = sourceNode!;
        link.target = targetNode!;
    });

    simulation.nodes(nodes);
    simulation.force<d3.ForceLink<any, Link>>('link').links(links);
    updateElements();

    simulation.alpha(1).restart();
}

function updateElements(): void {
    link = link.data(links);
    link.exit().remove();
    link = link
        .enter()
        .append('line')
        .attr('class', 'link')
        .attr('marker-end', 'url(#arrow)')
        .style('stroke-dasharray', '3, 3')
        .merge(link);

    linkLabels = linkLabels.data(links);
    linkLabels.exit().remove();
    linkLabels = link
        .enter()
        .append('text')
        .attr('class', 'linktext')
        .attr('dy', '-0.5em')
        .text(d => Math.round(d.balance_delta))
        .style('font-family', 'sans-serif')
        .merge(linkLabels);

    node = node.data(nodes);
    node.exit().remove();
    node = node
        .enter()
        .append('circle')
        .attr('r', 15)
        .attr('fill', (d: any) => getNodeColor(d))
        .call(
            d3
                .drag()
                .on('start', (event, d) => dragstarted(event, d, simulation))
                .on('drag', (event, d) => dragged(event, d))
                .on('end', (event, d) => dragended(event, d, simulation))
        )
        .merge(node);

    labels = labels.data(nodes);
    labels.exit().remove();
    let newLabels = labels
        .enter()
        .append('g')
        .attr('class', 'node-labels');

    newLabels
        .append('text')
        .text(d => d.address_name)
        .attr('text-anchor', 'middle')
        .attr('dy', 35)
        .style('font-size', '12px')
        .style('font-family', 'sans-serif');

    newLabels
        .append('text')
        .text(d => truncateAddress(d.address))
        .attr('text-anchor', 'middle')
        .attr('dy', d => (d.address_name ? 48 : 30))
        .style('font-size', '11px')
        .style('font-family', 'sans-serif');

    newLabels
        .append('text')
        .text(d => d.balance.toFixed(1))
        .attr('text-anchor', 'middle')
        .attr('dy', d => (d.address_name ? 60 : 45))
        .style('font-size', '11px')
        .style('font-family', 'sans-serif');

    labels = labels.merge(newLabels);

    node.on('click', (event, d) => handleNodeClick(d, updateGraph));

    renderGraph();
}



loadAndUpdateGraph(PATHS.one, initializeGraph);