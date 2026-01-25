
import React from 'react';
import { Transaction, TransactionSource } from '../types';
import { ArrowDownLeft, ArrowUpRight, Calendar, CreditCard, FileText } from 'lucide-react';

interface Props {
  transaction: Transaction;
  onClick?: () => void;
  isSelected?: boolean;
}

export const TransactionCard: React.FC<Props> = ({ transaction, onClick, isSelected }) => {
  const isIncome = transaction.amount > 0;
  const isBank = transaction.source === TransactionSource.BANK;

  return (
    <div 
      onClick={onClick}
      className={`
        p-3 rounded-lg border mb-2 cursor-pointer transition-all duration-200
        ${isSelected 
          ? 'border-indigo-500 ring-1 ring-indigo-500 bg-indigo-50' 
          : 'border-gray-200 bg-white hover:border-indigo-300 hover:shadow-sm'
        }
      `}
    >
      <div className="flex justify-between items-start">
        <div className="flex items-center space-x-2 text-xs text-gray-500 mb-1">
          <Calendar size={12} />
          <span>{transaction.date}</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium uppercase bg-gray-100 text-gray-600">
             {isBank ? 'Banco' : 'Libro'}
          </span>
        </div>
        <div className={`text-sm font-bold ${isIncome ? 'text-green-600' : 'text-gray-900'}`}>
          {transaction.amount.toLocaleString('es-CO', { 
            style: 'currency', 
            currency: 'COP', 
            minimumFractionDigits: 2, 
            maximumFractionDigits: 2 
          })}
        </div>
      </div>
      
      <div className="flex items-start gap-2 mt-1">
        <div className={`mt-0.5 p-1 rounded-full ${isBank ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
           {isBank ? <CreditCard size={14} /> : <FileText size={14} />}
        </div>
        <p className="text-sm text-gray-700 leading-tight line-clamp-2">
          {transaction.description}
        </p>
      </div>
    </div>
  );
};
