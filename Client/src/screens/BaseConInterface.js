import BaseInterface from "./BaseInterface";
import TransferLayer from "../utils/TransferLayer";

export default class BaseConInterface extends BaseInterface {
    constructor(props) {
        super(props);
        this.state = {
            loading: true
        };
        this.transferLayer = new TransferLayer();
    }

    componentWillUnmount() {
        this.transferLayer.closeConnection();
    }

    componentDidMount() {
        this.establishConnection().then(() => {
            this.establishConnectionSuccess();
        }
        ).catch(() => {
            this.establishConnectionFailure();
        });
    }

    establishConnectionSuccess() {
        console.log("Connected to server with username and password");
        this.setState({ loading: false });
    }

    establishConnectionFailure() {
        console.log("Failed to connect to server with username and password");
        // this.setState({ loading: false });
    }

    networkError(error) {
        console.log("Failed to connect to server" + error);
    }

    establishConnection() {
        return new Promise((resolve, reject) => {
            this.transferLayer.connect()
        .then(async () => {
            this.transferLayer.sendRequest({
                type: "login",
                content:{
                    password: gPassword,
                    username: gUsername,
                    loginType: "username_password"
                },
                extra: null
            }, (response) => {
                if(response.type === "login" && response.success){
                    resolve();
                }else{
                    reject();
                }
            })})
        .catch(error => this.networkError(error));
        });
    }
};