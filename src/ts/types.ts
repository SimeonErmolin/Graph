import * as d3 from "d3";

export interface Node extends d3.SimulationNodeDatum {
    address: string;
    address_name: string;
    balance: number;
}

export interface Link extends d3.SimulationLinkDatum<Node> {
    from: string;
    to: string;
    balance_delta: number;
}

export interface GraphData {
    nodes: Node[];
    links: Link[];
}

export interface PathMap {
    [key: string]: string;
}

export interface NodeInfo {
    [key: string]: string;
}