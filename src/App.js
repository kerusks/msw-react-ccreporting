import "./App.css";
import { useEffect, useMemo, useRef, useState } from "react";
import { AgGridReact } from "ag-grid-react";

import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";

function App() {
  const gridRef = useRef();
  const [rowData, setRowData] = useState();
  const [columnDefs] = useState([
    { field: "companyName", filter: true },
    { field: "lastReportingDate", filter: true },
    { field: "lastReportingPeriod", filter: true },
    { field: "nextReportingDate", filter: true },
    { field: "nextReportingInferred", filter: true },
    { field: "pristine", headerName: "Pristine NRD", filter: true },
  ]);

  const gridStyle = useMemo(
    () => ({ height: "800px", width: "100%", padding: "20px" }),
    []
  );

  const statusBar = {
    statusPanels: [
      {
        statusPanel: "agTotalAndFilteredRowCountComponent",
        align: "right",
      },
    ],
  };

  const gridOptions = {
    columnDefs: columnDefs,
    defaultColDef: {
      sortable: true,
    },
    multiSortKey: "ctrl",
    onGridReady: (params) => {
      //// Sort by default as requested
      var defaultSortModel = [
        { colId: "companyName", sort: "asc", sortIndex: 0 },
        { colId: "lastReportingDate", sort: "desc", sortIndex: 1 },
      ];

      params.columnApi.applyColumnState({ state: defaultSortModel });
    },
  };

  useEffect(() => {
    fetch("/reporting")
      .then((result) => result.json())
      .then((rowData) => setRowData(rowData));
  }, []);

  return (
    <div className="App">
      <h1>Reporting</h1>

      <div style={gridStyle} className="ag-theme-alpine">
        <AgGridReact
          ref={gridRef}
          gridOptions={gridOptions}
          rowData={rowData}
          statusBar={statusBar}
        />
      </div>
    </div>
  );
}

export default App;
