## 表单

antd pro 里的 proForm 表单组件其实就是封装好了 Form.Item 和 表单组件。

### 自定义封装表单组件

类似上传单张图片的 Upload 组件，没有提供相应的 ProForm 组件，而且我们还需要获取到表单里的值填入到 Upload 里面的 img 里去，上传完成后 form 也可以获取到 Upload 里的图片链接。

Form.Item 的 children 会被注入 FormInstance ，我们可以通过注入的 FormInstance 获取和设置 field 的值，但是注意这个时候 Form.Item 不能和 name 共存， 而且使用 children 注入 FormInstance  的时候需要给 Form.Item 设置 shouldUpdate。

```tsx
   <Form.Item
      label={label}
      required={required}
      trigger='onChange'
      shouldUpdate
    >
      {
        ({ getFieldValue, setFieldsValue }) => {
          const handleChange = (info: UploadChangeParam<UploadFile<any>>) => {
            if (info.file.status === 'uploading') {
              setImgLoading(true)
              return;
            } else if (info.file.status === 'done' && typeof name === 'string') {
              setFieldsValue({
                [name]: info.file.response.data
              })
              return;
            }
            setImgLoading(false)
          }
          return (
            <Upload
              listType="picture-card"
              showUploadList={false}
              onChange={handleChange}
              action=''
              headers={{
                Authorization: 'Bearer ' + getToken()
              }}
              style={{
                width,
                height
              }}
            >
            {
              (name && getFieldValue(name)) ? (
                <img
                  style={{
                    width: '100%',
                    height: '100%'
                  }}
                  src={getFieldValue(name)}
                />
              ): (
                <div style={{ marginTop: 8 }}>
                  {imgLoading ? <LoadingOutlined /> : <PlusOutlined />}
                </div>
              )
            }
      </Upload>

          )
        }
      }
    </Form.Item>
```

