// This script is designed to test the solidity smart contract - SuppyChain.sol -- and the various functions within
// Declare a variable and assign the compiled smart contract artifact
var SupplyChain = artifacts.require('SupplyChain');

// Using truffle-assertions to test emitted events
const truffleAssert = require('truffle-assertions')

contract('SupplyChain', function(accounts) {
    // Declare few constants and assign a few sample accounts generated by ganache-cli
    var sku = 1;
    var vin = 1;
    const ownerID = accounts[0];
    const originManufacturerID = accounts[1];
    const originManufacturerName = "John Doe";
    const originManufacturerInformation = "Yarray Valley";
    const productNotes = "Best beans for Espresso";
    const productPrice = web3.utils.toWei("1", "ether");
    const dealerID = accounts[2];
    const consumerID = accounts[3];
    const emptyAddress = '0x0000000000000000000000000000000000000000';

    const state =  {
        Assembled: 0,
        SoldForDealer: 1,
        Shipped: 2,
        Received: 3,
        Purchased: 4
    };
    ///Available Accounts
    ///==================
    ///(0) 0x27d8d15cbc94527cadf5ec14b69519ae23288b95
    ///(1) 0x018c2dabef4904ecbd7118350a0c54dbeae3549a
    ///(2) 0xce5144391b4ab80668965f2cc4f2cc102380ef0a
    ///(3) 0x460c31107dd048e34971e57da2f99f659add4f02
    ///(4) 0xd37b7b8c62be2fdde8daa9816483aebdbd356088
    ///(5) 0x27f184bdc0e7a931b507ddd689d76dba10514bcb
    ///(6) 0xfe0df793060c49edca5ac9c104dd8e3375349978
    ///(7) 0xbd58a85c96cc6727859d853086fe8560bc137632
    ///(8) 0xe07b5ee5f738b2f87f88b99aac9c64ff1e0c7917
    ///(9) 0xbd3ff2e3aded055244d66544c9c059fa0851da44

    console.log("ganache-cli accounts used here...");
    console.log("Contract Owner: accounts[0] ", accounts[0]);
    console.log("Manufacturer: accounts[1] ", accounts[1]);
    console.log("Dealer: accounts[2] ", accounts[2]);
    console.log("Consumer: accounts[3] ", accounts[3]);

    // 1st Test
    it("Testing smart contract function assembleCar() that allows a manufacturer to assemble car", async() => {
        const supplyChain = await SupplyChain.deployed();

        // Mark an item as Assembled by calling function assembleItem()
        const result = await supplyChain.assembleCar(vin, originManufacturerID, originManufacturerName, originManufacturerInformation, productNotes, productPrice);

        // Retrieve the just now saved item from blockchain by calling function fetchItem()
        const resultBuffer = await supplyChain.fetchCarBuffer.call(vin);

        // Verify the result set
        assert.equal(resultBuffer[0], sku, 'Error: Invalid item SKU');
        assert.equal(resultBuffer[1], vin, 'Error: Invalid item VIN');
        assert.equal(resultBuffer[2], originManufacturerID, 'Error: Missing or Invalid ownerID');
        assert.equal(resultBuffer[3], originManufacturerID, 'Error: Missing or Invalid originManufacturerID');
        assert.equal(resultBuffer[4], originManufacturerName, 'Error: Missing or Invalid originManufacturerName');
        assert.equal(resultBuffer[5], originManufacturerInformation, 'Error: Missing or Invalid originManufacturerInformation');
        assert.equal(resultBuffer[6], productNotes, 'Error: Missing or Invalid productNotes');
        assert.equal(resultBuffer[7], productPrice, 'Error: Missing or Invalid productPrice');
        assert.equal(resultBuffer[8], state.Assembled, 'Error: Invalid item State');
        assert.equal(resultBuffer[9], emptyAddress, 'Error: Invalid dealerID');
        assert.equal(resultBuffer[10], emptyAddress, 'Error: Invalid consumerID')

        // Verify event emitted
        truffleAssert.eventEmitted(result, 'Assembled')
    });

    // 2nd Test
    it("Testing smart contract function buyItem() that allows a dealer to buy cars", async() => {
        const supplyChain = await SupplyChain.deployed();

        const balance = await web3.eth.getBalance(dealerID);

        //add the dealer role
        await supplyChain.addDealer(dealerID)

        // Mark an item as SoldForDealer by calling function buyCar()
        const result = await supplyChain.buyCar(vin,  {from: dealerID, value: balance, gasPrice:0});
        

        // Retrieve the just now saved item from blockchain by calling function fetchItem()
        const resultBuffer = await supplyChain.fetchCarBuffer.call(vin);

        // Verify the result set
        assert.equal(resultBuffer[2], dealerID, 'Error: Missing or Invalid ownerID');
        assert.equal(resultBuffer[8], state.SoldForDealer, 'Error: Invalid item State');
        assert.equal(resultBuffer[9], dealerID, 'Error: Invalid dealerID');
        assert.equal(resultBuffer[10], emptyAddress, 'Error: Invalid consumerID');
        
        // Verify event emitted
        truffleAssert.eventEmitted(result, 'SoldForDealer')
    });

    // 3rd Test
    it("Testing smart contract function shipItem() that allows a manufacturer to ship car", async() => {
        const supplyChain = await SupplyChain.deployed();

        //add the manufacturer role
        await supplyChain.addManufacturer(originManufacturerID)

        // Mark an item as SoldForDealer by calling function buyCar()
        const result = await supplyChain.shipCar(vin, {from: originManufacturerID});

        // Retrieve the just now saved item from blockchain by calling function fetchItem()
        const resultBuffer = await supplyChain.fetchCarBuffer.call(vin);

        // Verify the result set
        assert.equal(resultBuffer[8], state.Shipped, 'Error: Invalid item State');
        // Verify event emitted
        truffleAssert.eventEmitted(result, 'Shipped')
    });

    // 4th Test
    it("Testing smart contract function receiveItem() that allows a dealer to mark car received", async() => {
        const supplyChain = await SupplyChain.deployed();

        //add the dealer role
        await supplyChain.addDealer(dealerID)

        // Mark an item as SoldForDealer by calling function buyCar()
        const result = await supplyChain.receiveCar(vin, {from: dealerID});
        console.log('here is the result:', result)

        // Retrieve the just now saved item from blockchain by calling function fetchItem()
        const resultBuffer = await supplyChain.fetchCarBuffer.call(vin);
        //console.log(resultBuffer)

        // Verify the result set
        assert.equal(resultBuffer[8], state.Received, 'Error: Invalid item State');
        // Verify event emitted
        truffleAssert.eventEmitted(result, 'Received')
    });

    // 5th Test
    it("Testing smart contract function purchaseItem() that allows a consumer to purchase car", async() => {
        const supplyChain = await SupplyChain.deployed();

        const balance = await web3.eth.getBalance(consumerID);

        //add the consumer role
        await supplyChain.addConsumer(consumerID,{from: ownerID})

        // Mark an item as SoldForDealer by calling function buyCar()
        const result = await supplyChain.purchaseCar(vin,  {from: consumerID, value: balance, gasPrice:0});

        // Retrieve the just now saved item from blockchain by calling function fetchItem()
        const resultBuffer = await supplyChain.fetchCarBuffer.call(vin);

        // Verify the result set
        assert.equal(resultBuffer[2], consumerID, 'Error: Missing or Invalid ownerID');
        assert.equal(resultBuffer[8], state.Purchased, 'Error: Invalid item State');
        assert.equal(resultBuffer[9], dealerID, 'Error: Invalid dealerID');
        assert.equal(resultBuffer[10], consumerID, 'Error: Invalid consumerID');
        
        // Verify event emitted
        truffleAssert.eventEmitted(result, 'Purchased')
        
    });

    // 6th Test
    it("Testing smart contract function fetchItemBuffer() that allows anyone to fetch item details from blockchain", async() => {
        const supplyChain = await SupplyChain.deployed();

        // Retrieve the just now saved item from blockchain by calling function fetchItem()
        const resultBuffer = await supplyChain.fetchCarBuffer.call(vin);

        //console.log(resultBuffer)

        // Verify the result set
        assert.equal(resultBuffer[0], sku, 'Error: Invalid item SKU');
        assert.equal(resultBuffer[1], vin, 'Error: Invalid item VIN');
        assert.equal(resultBuffer[2], consumerID, 'Error: Missing or Invalid ownerID');
        assert.equal(resultBuffer[3], originManufacturerID, 'Error: Missing or Invalid originManufacturerID');
        assert.equal(resultBuffer[4], originManufacturerName, 'Error: Missing or Invalid originManufacturerName');
        assert.equal(resultBuffer[5], originManufacturerInformation, 'Error: Missing or Invalid originManufacturerInformation');
        assert.equal(resultBuffer[6], productNotes, 'Error: Missing or Invalid productNotes');
        assert.equal(resultBuffer[7], productPrice, 'Error: Missing or Invalid productPrice');
        assert.equal(resultBuffer[8], state.Purchased, 'Error: Invalid item State');
        assert.equal(resultBuffer[9], dealerID, 'Error: Invalid dealerID');
        assert.equal(resultBuffer[10], consumerID, 'Error: Invalid consumerID');
    });

});

