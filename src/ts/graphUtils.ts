import {infoAboutNodes, PATHS} from "./helpers";
import {loadAndUpdateGraph} from "./loadGraph";

export function handleNodeClick(d: any, updateGraph: any): void {
    for (const key in infoAboutNodes) {
        if (infoAboutNodes[key] === d.address) {
            loadAndUpdateGraph(PATHS[key], updateGraph());
            break;
        }
    }
}

export function truncateAddress(address: string): string {
    if (address.length > 12) {
        return address.substr(0, 7) + "....." + address.substr(-5);
    } else {
        return address;
    }
}

export function dragstarted(event: any, d: any, simulation: any): void {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
}

export function dragged(event: any, d: any): void {
    d.fx = event.x;
    d.fy = event.y;
}

export function dragended(event: any, d: any, simulation: any): void {
    if (!event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
}

export function getNodeColor(d: any): string {
    switch (d.type) {
        case "stakingpool":
            return "lightblue";
        case "cex":
            return "blue";
        case "token":
        case "service":
            return "orange";
        case "dao":
            return "blue";
        case "gambling":
            return "pink";
        case "smartcontract":
            return "orange";
        default:
            return "grey";
    }
}
