import { Spin } from "antd";
import React from "react";

function LoadingAnimation() {
    <div className='loading-overlay'>
        <Spin size="large" tip="Loading..." />
    </div>
}

export default LoadingAnimation;