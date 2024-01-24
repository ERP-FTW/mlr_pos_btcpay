/** @odoo-module */

import { _t } from "@web/core/l10n/translation";
import { PaymentInterface } from "@point_of_sale/app/payment/payment_interface";
import { ErrorPopup } from "@point_of_sale/app/errors/popups/error_popup";

const REQUEST_TIMEOUT = 5000

export class PaymentBTCPayPayment extends PaymentInterface {

    /**
    * @Override
    * @param { string } cid
    * @returns Promise
    */
    async send_payment_request(cid) {
        let line = this.pos.get_order().selected_paymentline;
        let order_id = this.pos.get_order().uid;
        console.log(line.payment_method.id);
        console.log(line.payment_method.use_payment_terminal);
        await super.send_payment_request(...arguments);
        let data = null;
        try {
	     /* data = await rpc.query({
              model: 'pos.payment.method',
              method: 'btcpay_create_crypto_invoice',
              args: [{pm_id: line.payment_method.id, amount: line.amount, order_id: order_id}],
            }, {
                silent: true,
            }); */
            data = await this.env.services.orm.silent.call(
              'pos.payment.method',
              'btcpay_create_crypto_invoice',
              [{pm_id: line.payment_method.id, amount: line.amount, order_id: order_id}],
             );
        }
        catch (error) {
           return false
        }
        console.log('Logging data') //SAGAR
        console.log(data) //SAGAR
        if(data.code != '0'){
            alert('Create invoice error:'+ data.code);
            return false;}
        const codeWriter = new window.ZXing.BrowserQRCodeSvgWriter();
        console.log(data.cryptopay_payment_link_serial);
        //let qr_code_svg = line.cryptopay_payment_link;
        let qr_code_svg = new XMLSerializer().serializeToString(codeWriter.write(data.cryptopay_payment_link, 150, 150));
        line.is_crypto_payment = true;
        line.cryptopay_payment_link = data.cryptopay_payment_link;
        line.cryptopay_payment_link_qr_code = "data:image/svg+xml;base64,"+ window.btoa(qr_code_svg);
        line.cryptopay_invoice_id = data.invoice_id;
        line.invoiced_crypto_amount = data.crypto_amt;
        line.cryptopay_payment_type = data.cryptopay_payment_type;
        let conversion_rate = line.amount/(line.invoiced_crypto_amount/100000000);
        line.conversion_rate = conversion_rate.toFixed(2);
        console.log(line.is_crypto_payment);
        console.log(line.cryptopay_payment_link_qr_code);
        console.log(data.cryptopay_payment_type);
        console.log(line.invoiced_crypto_amount);
        console.log(line.conversion_rate);
        line.set_payment_status('cryptowaiting');

        return this._check_payment_status(line);
    }

    /**
     * @Override
     * @param {} order
     * @param { string } cid
     * @returns Promise
     */
    async send_payment_cancel(order, cid) {
        super.send_payment_cancel(...arguments);
    }

    async _check_payment_status(line) {
        let api_resp = null;

		try {
			let order_id = this.pos.get_order().uid;
			console.log(order_id);
			console.log(line.payment_method.id);
			for (let i = 0; i < 100; i++) {
				line.crypto_payment_status = 'Checking Invoice status '+(i+1)+'/100';
				try {
                    api_resp = await this.env.services.orm.silent.call(
                       'pos.payment.method',
                       'btcpay_check_payment_status',
                        [{ invoice_id: line.cryptopay_invoice_id, pm_id: line.payment_method.id, order_id: order_id }],
                    );
					if (api_resp.status == 'Paid' || api_resp.status == 'Settled') {
						console.log("valid btcpay transaction - timer");
						line.crypto_payment_status = 'Invoice Paid';
						return true;
					}
					else if (api_resp.status == 'Expired' || api_resp.status == 'Invalid') {	
						console.log("invalid expired btcpay transaction - timer");
						alert('Check invoice error: Invoice has expired');
						line.crypto_payment_status = 'Invoice Expired';
						return false;
					}
				} catch (error) {
					console.log(error);
					return false;
				}
				await new Promise(r => setTimeout(r, 50000));
			}
		}
		catch (error) {
			console.error("An error occurred:", error.message);
		}
		finally {
			console.log("Completed ");
		}
        return false;
    }
}
