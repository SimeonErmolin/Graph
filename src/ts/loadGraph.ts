import * as d3 from 'd3';

export function loadAndUpdateGraph(jsonPath: string, updateGraph: (data: any) => void): void {
    d3.json(jsonPath)
        .then((data: any) => {
            return updateGraph(data);
        })
        .catch((error: any) => {
            console.error('Ошибка загрузки данных:', error);
        });
}
