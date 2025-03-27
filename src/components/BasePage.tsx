import Header from '../components/Header';
import React from 'react';

interface BasePagePropsType {
    children: React.ReactNode
}

export default function BasePage(props: BasePagePropsType) {
    return (
        <>
            <Header />
            {props.children}
        </>
    )
}
