App = {
    web3Provider: null,
    contracts: {},
    emptyAddress: "0x0000000000000000000000000000000000000000",
    sku: 0,
    vin: 0,
    metamaskAccountID: "0x0000000000000000000000000000000000000000",
    ownerID: "0x0000000000000000000000000000000000000000",
    originManufacturerID: "0x0000000000000000000000000000000000000000",
    originManufacturerName: null,
    originManufacturerInformation: null,
    productNotes: null,
    productPrice: 0,
    dealerID: "0x0000000000000000000000000000000000000000",
    consumerID: "0x0000000000000000000000000000000000000000",

    init: async function () {
        App.readForm();
        /// Setup access to blockchain
        return await App.initWeb3();
    },

    readForm: function () {
        App.vin = $("#assembleFormVin").val();
        App.originManufacturerID = $("#assembleFormOriginID").val();
        App.originManufacturerName = $("#assembleFormOriginName").val();
        App.originManufacturerInformation = $("#assembleFormOriginInformation").val();
        App.productNotes = $("#assembleFormProductNotes").val();
        App.productPrice = $("#assembleFormProductPrice").val();

        console.log(
            App.vin,
            App.originManufacturerID,
            App.originManufacturerName,
            App.originManufacturerInformation,
            App.productNotes,
            App.productPrice
        );
    },

    initWeb3: async function () {
        /// Find or Inject Web3 Provider
        /// Modern dapp browsers...
        if (window.ethereum) {
            App.web3Provider = window.ethereum;
            try {
                // Request account access
                await window.ethereum.enable();
            } catch (error) {
                // User denied account access...
                console.error("User denied account access")
            }
        }
        // Legacy dapp browsers...
        else if (window.web3) {
            App.web3Provider = window.web3.currentProvider;
        }
        // If no injected web3 instance is detected, fall back to Ganache
        else {
            App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
        }

        App.getMetaskAccountID();

        return App.initSupplyChain();
    },

    getMetaskAccountID: function () {
        web3 = new Web3(App.web3Provider);

        // Retrieving accounts
        web3.eth.getAccounts(function(err, res) {
            if (err) {
                console.log('Error:',err);
                return;
            }
            console.log('getMetaskID:',res);
            App.metamaskAccountID = res[0];

        })
    },

    initSupplyChain: function () {
        /// Source the truffle compiled smart contracts
        var jsonSupplyChain='../../build/contracts/SupplyChain.json';
        
        /// JSONfy the smart contracts
        $.getJSON(jsonSupplyChain, function(data) {
            console.log('data',data);
            var SupplyChainArtifact = data;
            App.contracts.SupplyChain = TruffleContract(SupplyChainArtifact);
            App.contracts.SupplyChain.setProvider(App.web3Provider);

            App.fetchEvents();

        });

        return App.bindEvents();
    },

    bindEvents: function() {
        $(document).on('click', App.handleButtonClick);
    },

    handleButtonClick: async function(event) {
        event.preventDefault();

        App.getMetaskAccountID();

        var processId = parseInt($(event.target).data('id'));
        console.log('processId',processId);

        switch(processId) {
            case 1:
                return await App.assembleCar(event);
                break;
            case 2:
                return await App.buyCar(event);
                break;
            case 3:
                return await App.shipCar(event);
                break;
            case 4:
                return await App.receiveCar(event);
                break;
            case 5:
                return await App.purchaseCar(event);
                break;
            case 6:
                return await App.fetchCarBuffer(event);
                break;
            }
    },

    assembleCar: function(event) {
        event.preventDefault();
        App.readForm();

        App.contracts.SupplyChain.deployed().then(function(instance) {
            return instance.assembleCar(
                App.vin,
                App.metamaskAccountID,
                App.originManufacturerName,
                App.originManufacturerInformation,
                App.productNotes,
                App.productPrice
            );
        }).then(function(result) {
            console.log('assembleCar', App.formatCarInfo(result));
        }).catch(function(err) {
            console.log(err.message);
        });
    },

    buyCar: function (event) {
        event.preventDefault();
        const vin = $('#changeStateVin').val();
        App.contracts.SupplyChain.deployed().then(function(instance) {
            const walletValue = web3.toWei(3, "ether");
            return instance.buyCar(vin, {from: App.metamaskAccountID, value: walletValue});
        }).then(function(result) {
            console.log('buyCar',result);
        }).catch(function(err) {
            console.log(err.message);
        });
    },

    shipCar: function (event) {
        event.preventDefault();
        const vin = $('#changeStateVin').val();

        App.contracts.SupplyChain.deployed().then(function(instance) {
            return instance.shipCar(vin, {from: App.metamaskAccountID});
        }).then(function(result) {
            console.log('shipCar',result);
        }).catch(function(err) {
            console.log(err.message);
        });
    },

    receiveCar: function (event) {
        event.preventDefault();
        const vin = $('#changeStateVin').val();

        App.contracts.SupplyChain.deployed().then(function(instance) {
            return instance.receiveCar(vin, {from: App.metamaskAccountID});
        }).then(function(result) {
            console.log('receiveCar',result);
        }).catch(function(err) {
            console.log(err.message);
        });
    },

    purchaseCar: function (event) {
        event.preventDefault();
        const vin = $('#changeStateVin').val();

        App.contracts.SupplyChain.deployed().then(function(instance) {
            const walletValue = web3.toWei(3, "ether");
            return instance.purchaseCar(vin, {from: App.metamaskAccountID, value: walletValue});
        }).then(function(result) {
            console.log('purchaseCar',result);
        }).catch(function(err) {
            console.log(err.message);
        });
    },

    fetchCarBuffer: function () {
        App.vin = $('#vin-input').val();
        console.log('vin',App.vin);

        App.contracts.SupplyChain.deployed().then(function(instance) {
          return instance.fetchCarBuffer(App.vin);
        }).then(function(result) {
            const data = App.formatCarInfo(result);
          $("#car-info-block").text(JSON.stringify(data, undefined, 2));
          console.log('fetchCarBuffer', data);
        }).catch(function(err) {
          console.log(err.message);
        });
    },

    fetchEvents: function () {
        if (typeof App.contracts.SupplyChain.currentProvider.sendAsync !== "function") {
            App.contracts.SupplyChain.currentProvider.sendAsync = function () {
                return App.contracts.SupplyChain.currentProvider.send.apply(
                App.contracts.SupplyChain.currentProvider,
                    arguments
              );
            };
        }

        App.contracts.SupplyChain.deployed().then(function(instance) {
        var events = instance.allEvents(function(err, log){
          if (!err)
            $("#ftc-events").append('<li>' + log.event + ' - ' + log.transactionHash + '</li>');
        });
        }).catch(function(err) {
          console.log(err.message);
        });
        
    },

    formatCarInfo: function(response=[]) {
        return {
            sku: response[0],
            vin: response[1],
            ownerID: response[2],
            originManufacturerID: response[3],
            originManufacturerName: response[4],
            originManufacturerInformation: response[5],
            productNotes: response[6],
            productPrice: response[7],
            state: response[8],
            dealerID: response[9],
            consumerID: response[10],
        }
    }
};

$(function () {
    $(window).load(function () {
        App.init();
    });
});
