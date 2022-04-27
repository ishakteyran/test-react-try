import React, {useState, useEffect, useRef} from 'react';

import {DataTable} from 'primereact/datatable';
import {Column} from 'primereact/column';
import {Dialog} from 'primereact/dialog';
import {Dropdown} from 'primereact/dropdown';
import {Button} from 'primereact/button';
import {Calendar} from 'primereact/calendar';
import { Toast } from 'primereact/toast';
import {InputNumber} from "primereact/inputnumber";
import socketIOClient from "socket.io-client";
import * as Constants from '../constants/constants';

import '../Datatable.css';


//  CONSTANTS
const ENDPOINT = Constants.socketURL; //"http://localhost:3001";
const APIURL = Constants.apiURL+Constants.apiURLPrefix;
const socket = socketIOClient(ENDPOINT);


const DataTableCrypto = () => {

    const toast = useRef(null);

    /// State values used by dataTable
    const [crypto, setCrypto] = useState<any[]>([]); // trade exchange data received from server
    const [tableData, setTableData] = useState<any[]>([]); // filtered trade exchange list
    const [response, setResponse] = useState<any[]>([]); // currency (crypto and regular) data (prices, image URLs etc)
    const [displayModal, setDisplayModal] = useState(false);
    const [selectedTrade, setSelectedTrade] = useState<any>(null); //trade data selected on dataTable (for mobile) to be shown on exchange modal

    /// State values used by filter
    const [dateFilterStart, setDateFilterStart] = useState<Date | Date[] | undefined>(undefined);
    const [dateFilterEnd, setDateFilterEnd] = useState<Date | Date[] | undefined>(undefined);
    const [type, setType] = useState<any>(null);

    /// State values used by submit form
    const [cryptoList, setCryptoList] = useState<any[]>([]);
    const [selectedCrypto, setSelectedCrypto] = useState<any>({});
    const [cryptoAmount, setCryptoAmount] = useState<number | null>(0);
    const [targetAmount, setTargetAmount] = useState<number | null>(0);
    const [targetList, setTargetList] = useState<any[]>([]);
    const [selectedTarget, setSelectedTarget] = useState<any>({});
    const [priceList, setPriceList] = useState<any[]>([]);



    /// socket event listener
    const listener = (data: any) => {
        setResponse(data);
        getApiData();

    }

    /// Get exchange data from db
    const getApiData = () => {

        fetch(APIURL+Constants.apiGetEndpoint, {
            method: 'GET',
            headers: {
                accept: 'application/json',
            },
        })
            .then((response) => response.json())
            .then((data) => {
                setCrypto(data);
                setTableData(data);
                console.log("data from API : ", data)
            })
            .catch(error=>{
                // @ts-ignore
                toast.current.show({severity:'error', summary: 'Error Message', detail:error, life: 3000})
            })
    }

    /// Submit exchange data
    const submitTradeData = () => {

        if(cryptoAmount === 0 || targetAmount === 0 || !selectedCrypto || !selectedTarget){
            // @ts-ignore
            toast.current.show({severity:'warn', summary: 'Warning', detail:Constants.messageFillAllFields, life: 5000});
            return;
        }

        fetch(APIURL+Constants.apiPostEndpoint, {

            // Adding method type
            method: "POST",

            // Adding body or contents to send
            body: JSON.stringify({
                transactionDate: new Date(),
                currencyFrom: selectedCrypto.name,
                amount1:cryptoAmount,
                currency2:selectedTarget.name,
                amount2:targetAmount,
                conversionType:"Exchanged"
            }),

            // Adding headers to the request
            headers: {
                "Content-type": "application/json; charset=UTF-8"
            }
        })

            // Converting to JSON
            .then(response => response.json())

            // Displaying results to console
            .then(json => {
                if(json.message)
                    { // @ts-ignore
                        toast.current.show({severity:'error', summary: 'Error Message', detail:json.message, life: 3000});
                    }
                else{
                    // @ts-ignore
                    toast.current.show({severity:'success', summary: 'Success Message', detail:Constants.exchangeMessageSubmit, life: 3000});
                }
                getApiData();
            });
    }


    /// Register listener to socket event
    useEffect(() => {

        socket.on(Constants.socketEventName, listener);



        return () => {
            socket.off(Constants.socketEventName, listener)
        };


    }, [response])

    /// Generate currency lists for dropdowns and refresh price list.
    useEffect(() => {
        generateCurrencyList();
        generatePriceList();
    }, [response]);

    const generateCurrencyList = () => {
        if(response.length === 0) return;
        let responseList = response;
        let idx:  any[] = [];
        let cList = [];
        let tList = [];
        for (let i = 0; i < response.length; i++) {
            let element = responseList[i];
            if (idx.indexOf(element.base) === -1) {
                idx.push(element.base);
                cList.push({
                    name: element.name,
                    base: element.base,
                    fractions: element.baseDecimalPlaces,
                    imgUrl: element.baseUrl
                })
            }
            if (idx.indexOf(element.target) === -1) {
                idx.push(element.target);
                tList.push({name: element.target, fractions: element.targetDecimalPlaces, imgUrl: element.targetUrl})
            }
        }
        setCryptoList(cList);
        setTargetList(tList);
    }

    const generatePriceList = () => {
        if(response.length === 0) return;
        let responseList = response;
        let result = [];
        for (let i = 0; i < response.length; i++) {
            let element = responseList[i];
            result.push({key: element.base + "-" + element.target, value: element.price})
        }
        setPriceList(result);
    }

    /// Calculate target currency amount (price) when selected crypto, selected target currency or amount of selected crypto changes
    useEffect(()=>{
        calculatePrice();
    },[selectedCrypto,selectedTarget,cryptoAmount]);

    /// Calculate target price
    const calculatePrice = () => {
        console.log("CALCULATING PRICE");
        if (selectedTarget && selectedCrypto) {
            const price = priceList.find(x => x.key === selectedCrypto.base + "-" + selectedTarget.name);
            if(!price)
                return;
            const cAmount = cryptoAmount ?? 0;

            setTargetAmount(price.value * cAmount);
        }
    }

    /// Calculate selected crypto amount (price) when target currency changes.
    useEffect(()=>{
        calculateReversePrice();
    },[targetAmount]);

    /// Calculate crypto amount
    const calculateReversePrice = () => {
        console.log("CALCULATING REVERSE PRICE");
        if (selectedTarget && selectedCrypto) {
            const price = priceList.find(x => x.key === selectedCrypto.base + "-" + selectedTarget.name);
            console.log("price : ", price)
            if(!price)
                return;
            const tAmount = targetAmount ?? 0;
            const value = tAmount / Number(price.value);
            console.log("value : ", value);

            setCryptoAmount(value);
        }
    }

    /// dropdown values change events
    const onTypeChange = (e: { value: any }) => {
        setType(e.value);
    }
    const onCryptoChange = (e: { value: any }) => {
        setSelectedCrypto(e.value);
    }
    const onTargetChange = (e: { value: any }) => {
        setSelectedTarget(e.value);
    }

    //Filter data shown in the table
    const filterData = () => {
        let tblData = crypto;
        console.log("tableData : ", tblData);
        console.log("date1 : ", dateFilterStart);
        console.log("date2 : ", dateFilterEnd);
        console.log("type : ", type)
        if (dateFilterStart) {
            tblData = tblData.filter(x => new Date(x.transactionDate) >= new Date(dateFilterStart.toLocaleString()));
            console.log("tableData F1: ", tblData);
        }
        if (dateFilterEnd) {
            tblData = tblData.filter(x => new Date(x.transactionDate) <= new Date(dateFilterEnd.toLocaleString()));
            console.log("tableData F2: ", tblData);
        }

        if (type)
            tblData = tblData.filter(x => x.conversionType === type.name);
        console.log("tableData FILTERED : ", tblData);
        setTableData(tblData);

    }

    /// Clear all filters
    const clearFilterData = () => {

        setType(null);
        setDateFilterEnd(undefined);
        setDateFilterStart(undefined);
        setTableData(crypto);

    }


    /// set template to be shown in crypto and currency dropdowns
    const currencyOptionTemplate = (option: any) => {
        return (
            <div className="">
                <img alt={option.name} src={option.imgUrl}
                     style={{width: '24px', height:'24px'}} />
                <span> {option.name}</span>
            </div>
        );
    }

    /// set template to be shown in crypto and currency dropdowns for teh selected item.
    const selectedCurrencyTemplate = (option: any) => {
        if (option) {
            return (
                <div className="">
                    <img alt={option.name} src={option.imgUrl}
                         style={{width: '24px', height:'24px'}}  />
                    <span> {option.name}</span>
                </div>
            );
        };

        return (
            <span>
                {Constants.chooseCurrency}
            </span>
        );
    }

    useEffect(() => {
        getApiData();
    }, []);

    ///format date value to show in dataTable
    const formatDate = (value: any) => {
        console.log("Date value in formatDate : ", value)
        const date = new Date(value);
        return date.toLocaleDateString('en-US', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
        });
    }

    /// render filter area
    const renderFilter = () => {

        return <>
            <div className="mt-3 border-1">
                <div className="p-fluid grid formgrid row">
                    <div className="field col-4 col-md-3">
                        <label htmlFor="fromDate">From Date</label>
                        <Calendar id="fromDate" dateFormat="mm/dd/yy" value={dateFilterStart}
                                  onChange={(e) => setDateFilterStart(e.value)}
                                  onMonthChange={() => {}}/>
                    </div>
                    <div className="field col-4 col-md-3">
                        <label htmlFor="toDate">To Date</label>
                        <Calendar id="toDate" className="mr-3" dateFormat="mm/dd/yy" value={dateFilterEnd}
                                  onChange={(e) => setDateFilterEnd(e.value)} onMonthChange={() => {}}/>
                    </div>
                    <div className="field col-4 d-none d-md-inline col-md-3">
                        <label htmlFor="type">Type</label>
                        <Dropdown id="type" value={type} options={[{name: 'Live Price', code: 'LP'},
                            {name: 'Exchanged', code: 'EX'}]} onChange={onTypeChange} optionLabel="name"
                                  placeholder="Select a Type"/>
                    </div>

                    <div className="field col-4 col-md-3 mt-4">
                        <div className="d-flex justify-content-around align-items-center">

                            <Button icon="pi pi-filter" className="p-button-rounded p-button-success"
                                    aria-label="Filter" onClick={filterData}/>
                            <Button icon="pi pi-times" className="p-button-rounded p-button-danger" aria-label="Clear"
                                    onClick={clearFilterData}/>

                        </div>
                    </div>
                </div>
            </div>
        </>


    }
    const filter = renderFilter();

    /// render trade (exchange) submit form
    const renderTradeForm = () => {

        // @ts-ignore
        return  cryptoList && targetList && <>
            <div>
                <h4>Exchange</h4>
            </div>

            <div className="mt-3 border-1">
                <div className="p-fluid grid formgrid row">
                    <div className="field col-12 col-md-2">
                        <label htmlFor="type">Currency from</label>

                        <Dropdown value={selectedCrypto} options={cryptoList} onChange={onCryptoChange}
                                  optionLabel="name"
                                  itemTemplate={currencyOptionTemplate} valueTemplate={selectedCurrencyTemplate}/>
                    </div>
                    <div className="field col-12 col-md-2">
                        <label htmlFor="toDate">Amount</label>
                        <InputNumber value={cryptoAmount} onValueChange={(e) => {setCryptoAmount(e.value);}} mode="decimal"
                                     minFractionDigits={2} maxFractionDigits={selectedCrypto.fractions}/>
                    </div>


                    <div className="field flex d-flex justify-content-center align-items-center">
                        <div className="d-none d-md-inline">
                            {"="}
                        </div>
                    </div>


                    <div className="field col-12 col-md-2">
                        <label htmlFor="type">Currency to</label>
                        <Dropdown value={selectedTarget} options={targetList} onChange={onTargetChange}
                                  optionLabel="name"
                                  itemTemplate={currencyOptionTemplate} valueTemplate={selectedCurrencyTemplate}/>
                    </div>
                    <div className="field col-12 col-md-2">
                        <label htmlFor="toDate">Amount</label>
                        <InputNumber value={targetAmount} onValueChange={(e) =>{ setTargetAmount(e.value); }} mode="decimal"
                                     minFractionDigits={2} maxFractionDigits={selectedTarget.fractions}/>
                    </div>

                    <div className="col-12 col-md-2 flex d-flex align-items-end mb-1 mt-2">


                            <Button label="Submit" className="p-button p-button-success w-100" aria-label="Filter"
                                    onClick={submitTradeData}/>

                    </div>
                </div>
            </div>
        </>


    }
    const form = renderTradeForm();

    /// date template for dataTable
    const dateBodyTemplate = (rowData: any) => {
        return formatDate(rowData.transactionDate);
    }

    /// Exchange Type template for dataTable
    const typeBodyTemplate = (rowData: any) => {
        let classCss = "";
        if(rowData.conversionType === "Live Price")
            classCss = "text-success font-weight-bold"
        else
            classCss = "text-primary font-weight-bold"

        return <span className={classCss}> {rowData.conversionType} </span>
    }

    const renderModalFooter = () => {
        return (
            <div className="">
                <Button label="Close" onClick={() => setDisplayModal(false)}
                        className="p-button p-button-success w-100"/>
            </div>
        );
    }

    /// template for datatable mobile screen
    const mobileScreenBodyTemplate = (rowData: any) => {
        if (!rowData || response.length === 0 || crypto.length === 0) return null;
        const symbol = response.find(x => x.name === rowData.currencyFrom);
        // @ts-ignore
        let element = <>
            <div className="row" /*onClick={()=>{generatedModal(rowData); setDisplayModal(true);}}*/>

                <div className="col-10">
                    <p><span className="font-weight-bold">{rowData.currencyFrom} {'->'} {rowData.currency2}</span></p>
                    <p><span>Amount {symbol?.base} {rowData.amount1}</span></p>
                </div>
                <div className="col-2">
                    <span className="text-success"><i className="pi pi-circle-on"></i></span>
                </div>

            </div>
        </>;
        return symbol && rowData && element;
    }

    /// render Modal to be shown when ro clicked on mobile screen dataTable
    const renderModal = (rowData: any) => {
        return <>
            <Dialog header="Exchange" visible={displayModal} onHide={() => setDisplayModal(false)}
                    breakpoints={{'960px': '75vw'}} style={{width: '50vw'}} footer={renderModalFooter}>
                <table className="table table-sm table-borderless">
                    <tbody>
                    <tr>
                        <td>Date & Time</td>
                        <td>{formatDate(rowData.transactionDate)}</td>
                    </tr>
                    <tr>
                        <td>Status</td>
                        <td><span className="text-success"><i className="pi pi-circle-on"></i>  Approved</span></td>
                    </tr>
                    <tr>
                        <td>From</td>
                        <td>{rowData.currencyFrom}</td>
                    </tr>
                    <tr>
                        <td>To</td>
                        <td>{rowData.currency2}</td>
                    </tr>
                    <tr>
                        <td>Amount</td>
                        <td>{rowData.amount1}</td>
                    </tr>
                    <tr>
                        <td>Total Amount</td>
                        <td>{rowData.amount2}</td>
                    </tr>
                    </tbody>
                </table>
            </Dialog>
        </>
    }



    return (
        <>
            <Toast ref={toast} />
            { // trade data submit form
                 form
             }
            <hr/>
            <div className="mt-5">
                <h4>History</h4>
            </div>
            <div className="mb-3 mt-1">
                { //filter form
                    filter}
            </div>
            <hr/>

            {
                /// Datatable for desktop
            }
            <div className="datatable-filter-demo d-none d-md-block mt-4">

                <div className="card">
                    {
                        crypto && crypto.length > 0 &&
                            <>
                                <DataTable value={tableData} sortField="transactionDate" sortOrder={-1} paginator className="p-datatable-customers" showGridlines
                                           rows={10}
                                           dataKey="id" responsiveLayout="scroll" emptyMessage="No data found.">


                                    <Column header="Date Time" sortable sortField="transactionDate"  dataType="date"
                                            field="transactionDate" style={{minWidth: '5rem'}}
                                            body={dateBodyTemplate}/>

                                    <Column field="currencyFrom" header="Currency From" style={{minWidth: '6rem'}}/>

                                    <Column field="amount1" header="Amount 1" style={{minWidth: '6rem'}}/>

                                    <Column field="currency2" header="Currency To" style={{minWidth: '6rem'}}/>

                                    <Column field="amount2" header="Amount 2" style={{minWidth: '6rem'}}/>

                                    <Column header="Type"
                                            field="conversionType" style={{minWidth: '5rem'}}
                                            body={typeBodyTemplate}/>
                                </DataTable>
                            </>
                    }
                </div>

            </div>


            {
                /// Datatable for mobile
            }
            <div className="datatable-filter-demo mt-4 d-md-none">
                <div className="card">
                    {
                        crypto && crypto.length > 0 &&
                            <>
                                <DataTable value={tableData} paginator className="p-datatable-customers" showGridlines
                                           rows={10}
                                           selectionMode="single" selection={selectedTrade}
                                           onSelectionChange={
                                               e => {
                                                    setSelectedTrade(e.value);
                                                    setDisplayModal(true);
                                                }
                                           }
                                           dataKey="id" responsiveLayout="scroll" emptyMessage="No data found.">

                                    <Column headerClassName="d-none" filterField="transactionDate" dataType="date"
                                            field="transactionDate" style={{minWidth: '10rem'}}
                                            body={mobileScreenBodyTemplate}/>

                                </DataTable>

                                {
                                    displayModal && renderModal(selectedTrade)
                                }
                            </>
                    }
                </div>

            </div>

        </>
    );
};

export default DataTableCrypto