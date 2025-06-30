odoo.define("point_of_sale.BTCPayValidatePaymentScreen", function (require) {
    "use strict";
    const PaymentScreen = require("point_of_sale.PaymentScreen");
    const Registries = require("point_of_sale.Registries");
    var rpc = require('web.rpc');
  
    const BTCPayValidatePaymentScreen = (PaymentScreen) =>
      class extends PaymentScreen {
        setup() {
          super.setup();
        }
        async validateOrder(isForceValidate) {
            for (let line of this.paymentLines) {
            console.log("called btcpay validation");
            if(line.is_crypto_payment && line.payment_method.use_payment_terminal == 'btcpay') {
            try {
                let order_id = this.env.pos.get_order().uid;
                let api_resp = await rpc.query({
                    model: 'pos.payment.method',
                    method: 'btcpay_check_payment_status',
                    args: [{ invoice_id: line.cryptopay_invoice_id, pm_id: line.payment_method.id, order_id: order_id }],
                }, {
                    silent: true,
                });
                console.log(api_resp);
                console.log(api_resp.status);

                if (api_resp.status == 'Paid' || api_resp.status == 'Settled') {
                     console.log("valid btcpay transaction");
                     line.crypto_payment_status = 'Invoice Paid';
                     line.set_payment_status('done');
				}
                                else if (api_resp.status == 'New' || api_resp.status == 'Unpaid' || api_resp.status == 'Processing') {
	                                	await this.showPopup("ErrorPopup", {
    						title: this.env._t("Payment Request Pending"),
    						body: this.env._t("Payment Pending, retry after customer confirms"),
						});
                       		        line.set_payment_status('cryptowaiting');
                                }
				else if (api_resp.status == 'Expired' || api_resp.status == 'Invalid') {
				        console.log("expired btcpay transaction");
				        this.showPopup("ErrorPopup", {
                                                 title: this.env._t("Payment Request Expired"),
                                                 body: this.env._t("Payment Request expired, retry to send another send request"),
                                        });
				        line.set_payment_status('retry');
				}
				else if (api_resp.status) {
				        console.log("unknown btcpay transaction");
				        this.showPopup("ErrorPopup", {
                                                 title: this.env._t("Payment Request unknown"),
                                                 body: this.env._t("Payment Request unknown, retry to send another send request"),
                                        });
				}}
				catch (error) {
                 console.log(error);
                 return false;
             }}
            }
          super.validateOrder(isForceValidate);
        }
      };
    // CustomValidatePaymentScreen.template = "point_of_sale.CustomValidatePaymentScreenTemplate";
  
    Registries.Component.extend(PaymentScreen, BTCPayValidatePaymentScreen);
  
    return BTCPayValidatePaymentScreen;
  });
  
