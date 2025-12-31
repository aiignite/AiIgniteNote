import React from "react";
import { Modal as AntModal, ModalProps } from "antd";
import styled from "styled-components";

const StyledModal = styled(AntModal)<{ $width?: number }>`
  .ant-modal-header {
    border-bottom: 1px solid rgba(0, 0, 0, 0.08);
    padding: 16px 24px;
  }

  .ant-modal-title {
    font-size: 16px;
    font-weight: 600;
  }

  .ant-modal-body {
    padding: 24px;
  }

  .ant-modal-footer {
    border-top: 1px solid rgba(0, 0, 0, 0.08);
    padding: 12px 24px;
  }
`;

interface Props extends ModalProps {
  width?: number;
  children: React.ReactNode;
}

function Modal({ children, width = 520, ...props }: Props) {
  return (
    <StyledModal
      $width={width}
      width={width}
      centered
      destroyOnClose
      {...props}
    >
      {children}
    </StyledModal>
  );
}

export default Modal;
