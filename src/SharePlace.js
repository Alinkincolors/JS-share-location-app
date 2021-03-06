import { Modal } from './UI/Modal.js';
import { Map } from './UI/Map.js';
import { getCoordsFromAddress, getAddressFromCoords } from './Utility/Location.js'   

class PlaceFinder {
    constructor() {
        const addressForm = document.querySelector('form');
        const locateUserBtn = document.getElementById('locate-btn');
        this.shareBtn = document.getElementById('share-btn');
    
        addressForm.addEventListener('submit',this.findAddressHandler.bind(this));
        this.shareBtn.addEventListener('click' , this.sharePlaceHandler);
        locateUserBtn.addEventListener('click',this.locateUserHandler.bind(this));
    }

    sharePlaceHandler() {
        const sharedLinkInputElement = document.getElementById('share-link');
        sharedLinkInputElement.select();
        if (!navigator.clipboard) {
            return;
        }

        navigator.clipboard.writeText(sharedLinkInputElement.value)
        .then(() => {
            alert('Copied into clipboard!');
        })
        .catch(err => {
            console.log(err);
            sharedLinkInputElement.select();
        });
    }

    selectPlace(coordinates, address) {
        if (this.map) {
            this.map.render(coordinates);
        } else {
            this.map = new Map (coordinates);
        }
        
        fetch('http://localhost:5000/add-location', {
            method: 'POST',
            body: JSON.stringify({
                address: address,
                lat: coordinates.lat,
                lng: coordinates.lng
            }),
            headers: {
               'Content-Type': 'application/json' 
            }
        }).then(response => {
            return response.json();
        })
        .then(data => {
            console.log(data);
        });

        this.shareBtn.disabled = false;
        const sharedLinkInputElement = document.getElementById('share-link');
        sharedLinkInputElement.value = `${location.origin}/my-place?address=${encodeURI(address)}&lat=${coordinates.lat}&lng=${coordinates.lng}`;
    }
    

    locateUserHandler() {
        if (!navigator.geolocation) {
            alert(
                'location feature is not avaliable in your browser - please use a more modern browser or enter address manually'
                );
                return;   
        }
        const modal = new Modal(
            'loading-modal-content',
            'Loading location, pls wait!');
        modal.show();
        navigator.geolocation.getCurrentPosition(
            async successResult => {
                const coordinates = {
                    lat: successResult.coords.latitude,
                    lng: successResult.coords.longitude
                }
                const address = await getAddressFromCoords(coordinates);
                modal.hide();
                this.selectPlace(coordinates, address);
        },
            error => {
            modal.hide();
            alert(
                'Could not locate you unfortunately. Please enter an address manually!'
                );
            }
        );
    }

    async findAddressHandler(event) {
        event.preventDefault();
        const address = event.target.querySelector('input').value;
        if (!address || address.trim().length === 0) {
            alert('Invalid address entered - please try again!');
            return;
                }
        const modal = new Modal(
            'loading-modal-content',
            'Loading location, pls wait!'
        );
        modal.show(); 
        try {
            const coordinates = await getCoordsFromAddress(address);
            this.selectPlace(coordinates, address);
        } catch (err) {
            alert(err.message);
        }
        modal.hide();
    }
}

const placeFinder = new PlaceFinder();