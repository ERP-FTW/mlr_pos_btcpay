# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.
{
    'name': 'MLR POS Bitcoin Payments - BTCpay',
    'version': '1.0',
    'category': 'Sales/Point of Sale',
    'sequence': 7,
    'summary': 'Integrate your POS with Bitcoin on-chain and lightning payments',
    'description': '',
    'data': [
        'views/pos_payment_method.xml',
    ],
    'module_type': 'official',
    'depends': ['point_of_sale','mlr_pos_cryptopayments'],
    'installable': True,
    'assets': {
        'point_of_sale._assets_pos': [
            'mlr_pos_btcpay/static/**/*',
        ],
    },
    'license': 'LGPL-3',
}
